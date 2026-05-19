/**
 * v2 data model — Contact Consolidation Tool + multi-tenant workspaces.
 *
 * This file is the single source of truth for the new schema. Every server
 * write that touches contacts/imports/sourceConnections/communityAudience
 * must go through helpers (src/lib/v2/*) that stamp `workspaceId` and
 * enforce shape.
 *
 * Coexistence note:
 *   Legacy collections (users, communityMembers, blogs, …) stay live during
 *   migration. v2 adds NEW collections and ADDS workspaceId to existing ones.
 *   Existing pages keep working unchanged; new pages read from v2.
 */

import type { Timestamp, FieldValue } from 'firebase-admin/firestore';

/** ISO-2 country code, e.g. 'HK', 'US', 'FR'. */
export type CountryCode = string;

export type WorkspaceRole = 'owner' | 'admin' | 'community_creator' | 'read_only';

/* -------------------------------------------------------------------------- */
/*  workspaces                                                                */
/* -------------------------------------------------------------------------- */

/**
 * `workspaces/{workspaceId}`
 *
 * One workspace = one customer organization. Top-level tenancy unit.
 * Every contact/import/source/community/audience-tag doc is stamped with
 * `workspaceId`. Cross-workspace reads are denied by rules.
 *
 * `workspaceId` is the owner's uid for newly-migrated workspaces (stable),
 * or a generated id for fresh signups.
 */
export interface Workspace {
  workspaceId: string;
  name: string;
  ownerUid: string;
  createdAt: Timestamp | FieldValue;
  /** Workspace-wide settings, growing over time. */
  settings?: {
    /** Default country for E.164 parsing when the input lacks a country code. */
    defaultCountry?: CountryCode;
    /** Display branding (logo url, accent color) — optional. */
    brand?: { logoUrl?: string; accentHex?: string };
  };
}

/* -------------------------------------------------------------------------- */
/*  workspaceMembers                                                          */
/* -------------------------------------------------------------------------- */

/**
 * `workspaceMembers/{memberId}` — already exists in legacy schema.
 * v2 just adds `workspaceId` to the shape (legacy treats it as implicit).
 */
export interface WorkspaceMember {
  workspaceId: string;
  userId: string;
  email: string;
  displayName?: string;
  role: WorkspaceRole;
  status: 'active' | 'pending' | 'revoked';
  invitedBy: string;
  createdAt: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}

/* -------------------------------------------------------------------------- */
/*  contacts                                                                  */
/* -------------------------------------------------------------------------- */

export type ContactSourceProvider =
  | 'phone_csv'
  | 'csv_upload'
  | 'gsheets'
  | 'eventbrite'
  | 'resident_advisor'
  | 'seven_rooms'
  | 'manual'
  | 'legacy';

/**
 * One provenance record per source that contributed this contact.
 * A single contact can have many.
 */
export interface ContactSourceRecord {
  provider: ContactSourceProvider;
  /** Provider-side id (e.g. eventbrite attendee_id), or hash of the row for csv. */
  providerRecordId: string;
  /** When this provider first saw the contact. */
  importedAt: Timestamp | FieldValue;
  /** Which import batch brought it in (FK to imports/{id}). */
  importId: string;
}

/** A single event the contact attended, as observed at any source. */
export interface ContactEvent {
  provider: ContactSourceProvider;
  /** e.g. Eventbrite event_id or "csv:Vinyl Only Night". */
  eventKey: string;
  name: string;
  date?: Timestamp;
  countryCode?: CountryCode;
}

/**
 * `contacts/{contactId}`
 *
 * The new top-level address book entry. Lives in workspace scope.
 * Identity is by `dedupKey` (workspace-scoped hash of phoneE164 + emailLower).
 * Multiple ContactSourceRecord entries may merge into one contact.
 *
 * Rules: ADMIN-SDK-ONLY. Never client-readable.
 */
export interface Contact {
  contactId: string;
  workspaceId: string;
  dedupKey: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  emailLower?: string;
  phoneE164?: string;
  countryCode?: CountryCode;
  sources: ContactSourceRecord[];
  /** Communities this contact is currently assigned to (audience tags). */
  communityIds: string[];
  /** Import-batch tags applied to this contact. Names are display-only; ids are FK. */
  importTags: Array<{ importId: string; name: string }>;
  events: ContactEvent[];
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  /** If this contact was created by merging older docs, list them for audit/rollback. */
  mergedFromContactIds?: string[];
}

/* -------------------------------------------------------------------------- */
/*  imports                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * `imports/{importId}`
 *
 * One row per "push to Kyozo" in the onboarding wizard, or per ad-hoc import
 * later. Immutable after creation. Provides the audit-trail tag attached to
 * every contact in the batch ("first run", "January Master Import", …).
 *
 * Idempotency: writes are keyed by (workspaceId + name) — re-running an import
 * with the same name within the same workspace is a no-op (tag re-applied,
 * no new doc).
 */
export interface ImportBatch {
  importId: string;
  workspaceId: string;
  /** Human name; becomes the audit tag on every contact in the batch. */
  name: string;
  createdByUid: string;
  createdAt: Timestamp | FieldValue;
  /** Provider summary: which sources fed this import. */
  sources: Array<{ provider: ContactSourceProvider; recordCount: number }>;
  contactCount: number;
  duplicatesMerged: number;
  /** Communities the contacts were assigned into (may be empty). */
  communityIds: string[];
  /** Defensive: prevent re-runs from creating phantom new docs. */
  idempotencyKey: string;
}

/* -------------------------------------------------------------------------- */
/*  sourceConnections                                                         */
/* -------------------------------------------------------------------------- */

/**
 * `sourceConnections/{connectionId}`
 *
 * OAuth tokens for Eventbrite / Google Sheets / RA / 7 Rooms.
 *
 * SECURITY:
 *   - `tokenCiphertext` is encrypted with KMS (or NaCl secretbox + env key on
 *     local dev). The plaintext token NEVER lands in Firestore.
 *   - Rules: ADMIN-SDK-ONLY (`read, write: if false`). The dev portal and
 *     admin UIs ask the server to decrypt and use it on their behalf.
 */
export interface SourceConnection {
  connectionId: string;
  workspaceId: string;
  ownerUid: string;
  provider: ContactSourceProvider;
  providerAccountId?: string;
  /** Encrypted at rest. Base64. */
  tokenCiphertext: string;
  /** Encrypted refresh token (if provider issues one). */
  refreshTokenCiphertext?: string;
  scopes: string[];
  expiresAt?: Timestamp;
  lastSyncAt?: Timestamp | FieldValue;
  revokedAt?: Timestamp | FieldValue;
  createdAt: Timestamp | FieldValue;
}

/* -------------------------------------------------------------------------- */
/*  communityAudience                                                         */
/* -------------------------------------------------------------------------- */

/**
 * `communityAudience/{audienceId}`
 *
 * Soft assignment of a Contact to a Community. Distinct from
 * `communityMembers` (legacy) which is for AUTHENTICATED, role-bearing
 * members. An audience entry has no Firebase Auth identity behind it — it's a
 * person in the workspace's address book who's been tagged into this community.
 *
 * audienceId = `{workspaceId}_{communityId}_{contactId}` for natural keying.
 */
export interface CommunityAudience {
  audienceId: string;
  workspaceId: string;
  communityId: string;
  contactId: string;
  /** Tags applied at assignment time, e.g. ['Jazz', 'Electronics']. */
  tags: string[];
  addedByUid: string;
  addedAt: Timestamp | FieldValue;
}

/* -------------------------------------------------------------------------- */
/*  Community — additive fields                                               */
/* -------------------------------------------------------------------------- */

export type CommunityType =
  | 'cultural_institution'
  | 'community_group_venue'
  | 'other';

/**
 * Extensions to the existing `communities/{communityId}` doc. v2 ADDS these
 * fields; legacy fields (handle, name, ownerId, memberCount) stay.
 */
export interface CommunityV2Extensions {
  workspaceId: string;
  type?: CommunityType;
  /** 6-swatch palette specced in the original "Add New Community" dialog. */
  colorPalette?: Array<{ colorId: number; hexCode: string }>;
  /** Genres / category tags shown on the community card (Jazz, Electronics, Bass). */
  genres?: string[];
  heroImageUrl?: string;
  description?: string;
  /** Distinguish hard members (auth) from audience-only contact counts. */
  audienceCount?: number;
}

/* -------------------------------------------------------------------------- */
/*  Collection names — single import to use everywhere                        */
/* -------------------------------------------------------------------------- */

export const COLLECTIONS = {
  workspaces: 'workspaces',
  workspaceMembers: 'workspaceMembers',
  contacts: 'contacts',
  imports: 'imports',
  sourceConnections: 'sourceConnections',
  communityAudience: 'communityAudience',
  // Legacy, still in use:
  communities: 'communities',
  communityMembers: 'communityMembers',
  users: 'users',
  apiKeys: 'apiKeys',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
