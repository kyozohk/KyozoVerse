/**
 * OAuth connector registry + token storage.
 *
 * Each entry in PROVIDERS describes how to start an OAuth flow, where to
 * exchange the code, and what scopes to request. The actual data-sync
 * implementations live alongside the API routes that consume the tokens.
 *
 * Adding a new connector: add an entry here, set env vars, implement the
 * sync handler (see app/api/v1/connectors/[provider]/sync/route.ts).
 */

import { db } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import {
  COLLECTIONS,
  type ContactSourceProvider,
  type SourceConnection,
} from './types';
import { encryptString } from './encryption';

export type ConnectorStatus = 'available' | 'coming_soon';

export interface ConnectorConfig {
  /** Provider id used in storage and URLs (matches ContactSourceProvider). */
  provider: ContactSourceProvider;
  /** Display label for the UI card. */
  label: string;
  /** Short description ("OAuth connect", "Link to sheet", "iOS / Android"). */
  blurb: string;
  status: ConnectorStatus;
  /** OAuth authorize URL. */
  authorizeUrl?: string;
  /** OAuth token-exchange URL. */
  tokenUrl?: string;
  /** OAuth scopes to request. */
  scopes?: string[];
  /** Env var name for the OAuth client id. */
  clientIdEnv?: string;
  /** Env var name for the OAuth client secret. */
  clientSecretEnv?: string;
  /** Extra params appended to the authorize URL (e.g. `access_type=offline`). */
  authorizeExtra?: Record<string, string>;
  /** Auth method for token exchange. Default 'header'. */
  tokenAuth?: 'header' | 'body';
}

export const PROVIDERS: Record<string, ConnectorConfig> = {
  eventbrite: {
    provider: 'eventbrite',
    label: 'Eventbrite',
    blurb: 'OAuth connect',
    status: 'available',
    authorizeUrl: 'https://www.eventbrite.com/oauth/authorize',
    tokenUrl: 'https://www.eventbrite.com/oauth/token',
    scopes: [], // Eventbrite uses a single-tier private token, no granular scopes
    clientIdEnv: 'EVENTBRITE_CLIENT_ID',
    clientSecretEnv: 'EVENTBRITE_CLIENT_SECRET',
    tokenAuth: 'body',
  },
  gsheets: {
    provider: 'gsheets',
    label: 'Google Sheets',
    blurb: 'Link to sheet',
    status: 'available',
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets.readonly',
      'openid',
      'email',
    ],
    clientIdEnv: 'GOOGLE_OAUTH_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_OAUTH_CLIENT_SECRET',
    authorizeExtra: {
      access_type: 'offline',
      prompt: 'consent',
    },
    tokenAuth: 'body',
  },
  resident_advisor: {
    provider: 'resident_advisor',
    label: 'Resident Advisor',
    blurb: 'OAuth connect',
    status: 'coming_soon',
  },
  seven_rooms: {
    provider: 'seven_rooms',
    label: '7 Rooms',
    blurb: 'OAuth connect',
    status: 'coming_soon',
  },
  phone_csv: {
    provider: 'phone_csv',
    label: 'Phone CSV',
    blurb: 'iOS / Android',
    status: 'available',
    // No OAuth — file upload only. Uses /api/v1/contacts/import/csv directly.
  },
};

/* -------------------------------------------------------------------------- */
/*  Token storage                                                             */
/* -------------------------------------------------------------------------- */

export async function storeSourceConnection(input: {
  workspaceId: string;
  ownerUid: string;
  provider: ContactSourceProvider;
  providerAccountId?: string;
  rawAccessToken: string;
  rawRefreshToken?: string;
  scopes?: string[];
  /** Seconds-from-now until token expiry, if provider supplies it. */
  expiresInSec?: number;
}): Promise<{ connectionId: string }> {
  const connectionId = `${input.workspaceId}_${input.provider}_${input.ownerUid}`;
  const tokenCiphertext = encryptString(input.rawAccessToken);
  const refreshTokenCiphertext = input.rawRefreshToken
    ? encryptString(input.rawRefreshToken)
    : undefined;

  const doc: Omit<SourceConnection, 'expiresAt' | 'refreshTokenCiphertext'> & {
    expiresAt?: FirebaseFirestore.Timestamp;
    refreshTokenCiphertext?: string;
  } = {
    connectionId,
    workspaceId: input.workspaceId,
    ownerUid: input.ownerUid,
    provider: input.provider,
    providerAccountId: input.providerAccountId,
    tokenCiphertext,
    scopes: input.scopes || [],
    createdAt: FieldValue.serverTimestamp() as never,
  };
  if (refreshTokenCiphertext) doc.refreshTokenCiphertext = refreshTokenCiphertext;
  if (input.expiresInSec) {
    const { Timestamp } = await import('firebase-admin/firestore');
    doc.expiresAt = Timestamp.fromDate(new Date(Date.now() + input.expiresInSec * 1000));
  }

  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(doc)) {
    if (v !== undefined) cleaned[k] = v;
  }

  await db.collection(COLLECTIONS.sourceConnections).doc(connectionId).set(cleaned, { merge: true });
  return { connectionId };
}

/**
 * Mark a connection revoked. The doc stays for audit; the sync path skips
 * revoked connections.
 */
export async function revokeSourceConnection(
  workspaceId: string,
  connectionId: string
): Promise<boolean> {
  const ref = db.collection(COLLECTIONS.sourceConnections).doc(connectionId);
  const snap = await ref.get();
  if (!snap.exists) return false;
  const data = snap.data() as SourceConnection;
  if (data.workspaceId !== workspaceId) return false;
  await ref.update({ revokedAt: FieldValue.serverTimestamp() });
  return true;
}

/**
 * List active source connections for a workspace.
 */
export async function listSourceConnections(
  workspaceId: string
): Promise<SourceConnection[]> {
  const snap = await db
    .collection(COLLECTIONS.sourceConnections)
    .where('workspaceId', '==', workspaceId)
    .get();
  return snap.docs
    .map((d) => d.data() as SourceConnection)
    .filter((c) => !c.revokedAt);
}
