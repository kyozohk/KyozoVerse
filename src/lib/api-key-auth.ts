import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { db } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * API key authentication for the public /api/v1/* surface.
 *
 * Keys are stored in Firestore collection `apiKeys` keyed by their SHA-256 hash:
 *   {
 *     keyHash:    string  (doc id, sha256 of the raw key)
 *     prefix:     string  (first 8 chars of the raw key, for display)
 *     name:       string  (human label, e.g. "Production WhatsApp bot")
 *     ownerUid:   string? (user that minted it)
 *     ownerCommunity: string? (community handle the key belongs to)
 *     scopes:     string[] (e.g. ["email:send", "whatsapp:send", "communities:read"])
 *     createdAt:  Timestamp
 *     lastUsedAt: Timestamp?
 *     revokedAt:  Timestamp?
 *   }
 *
 * The raw key is shown to the user exactly once at mint time and never stored.
 *
 * Format of a raw key: `kyz_<32 base32 chars>`. Total length 36 chars.
 */

export const API_KEY_PREFIX = 'kyz_';
export const API_KEYS_COLLECTION = 'apiKeys';

export interface ApiKeyDoc {
  keyHash: string;
  prefix: string;
  name: string;
  ownerUid?: string;
  ownerCommunity?: string;
  scopes: string[];
  createdAt: FirebaseFirestore.Timestamp;
  lastUsedAt?: FirebaseFirestore.Timestamp;
  revokedAt?: FirebaseFirestore.Timestamp;
}

export interface ApiKeyAuthOk {
  ok: true;
  key: ApiKeyDoc;
}

export interface ApiKeyAuthErr {
  ok: false;
  response: NextResponse;
}

export type ApiKeyAuthResult = ApiKeyAuthOk | ApiKeyAuthErr;

/** SHA-256 hash a raw API key. */
export function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

/** Generate a new raw API key. Returns { rawKey, prefix, keyHash }. */
export function generateApiKey(): { rawKey: string; prefix: string; keyHash: string } {
  // 20 bytes -> 32 base32 chars (we use base32hex-ish via crockford for readability)
  const random = randomBytes(20).toString('base64url').slice(0, 32);
  const rawKey = `${API_KEY_PREFIX}${random}`;
  return {
    rawKey,
    prefix: rawKey.slice(0, 8),
    keyHash: hashApiKey(rawKey),
  };
}

/**
 * Verify the x-api-key header on a request.
 *
 * Usage:
 *   const auth = await verifyApiKey(request, { scope: 'email:send' });
 *   if (!auth.ok) return auth.response;
 *   // auth.key is the validated ApiKeyDoc
 *
 * In dev with no Firestore, set ALLOW_DEV_API_KEY=1 in env to short-circuit
 * with a synthetic key when KYOZO_API_KEY matches the supplied header. This is
 * ONLY honored when NODE_ENV !== 'production'.
 */
export async function verifyApiKey(
  request: NextRequest,
  opts: { scope?: string } = {}
): Promise<ApiKeyAuthResult> {
  const headerKey =
    request.headers.get('x-api-key') ||
    // Fallback: Authorization: ApiKey <key>
    (() => {
      const auth = request.headers.get('authorization') || '';
      const m = auth.match(/^ApiKey\s+(.+)$/i);
      return m ? m[1].trim() : null;
    })();

  if (!headerKey) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Missing API key. Provide x-api-key header.', code: 'MISSING_API_KEY' },
        { status: 401 }
      ),
    };
  }

  // Dev-only escape hatch
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.ALLOW_DEV_API_KEY === '1' &&
    process.env.KYOZO_API_KEY &&
    headerKey === process.env.KYOZO_API_KEY
  ) {
    return {
      ok: true,
      key: {
        keyHash: 'dev',
        prefix: headerKey.slice(0, 8),
        name: 'dev-shared-key',
        scopes: ['*'],
        createdAt: { seconds: 0, nanoseconds: 0 } as FirebaseFirestore.Timestamp,
      },
    };
  }

  const keyHash = hashApiKey(headerKey);

  let snap: FirebaseFirestore.DocumentSnapshot;
  try {
    snap = await db.collection(API_KEYS_COLLECTION).doc(keyHash).get();
  } catch (err) {
    console.error('[api-key-auth] Firestore lookup failed:', err);
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Auth backend unavailable.', code: 'AUTH_BACKEND_ERROR' },
        { status: 503 }
      ),
    };
  }

  if (!snap.exists) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Invalid API key.', code: 'INVALID_API_KEY' },
        { status: 401 }
      ),
    };
  }

  const key = snap.data() as ApiKeyDoc;

  if (key.revokedAt) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'API key has been revoked.', code: 'REVOKED_API_KEY' },
        { status: 401 }
      ),
    };
  }

  if (opts.scope && !key.scopes.includes('*') && !key.scopes.includes(opts.scope)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: `API key missing required scope: ${opts.scope}`,
          code: 'INSUFFICIENT_SCOPE',
        },
        { status: 403 }
      ),
    };
  }

  // Best-effort lastUsedAt update; do not block on it.
  snap.ref
    .update({ lastUsedAt: FieldValue.serverTimestamp() })
    .catch((err) => console.warn('[api-key-auth] lastUsedAt update failed:', err));

  return { ok: true, key };
}

/**
 * Convenience: combine api-key auth with the existing Firebase Bearer auth.
 * If x-api-key is present, validate it. Otherwise fall back to verifyAuth().
 *
 * This lets the same /v1/* route accept either an API key (for external/MCP
 * callers) or a Firebase ID token (for first-party app usage).
 */
export async function verifyApiKeyOrBearer(
  request: NextRequest,
  opts: { scope?: string } = {}
): Promise<
  | { ok: true; via: 'apiKey'; key: ApiKeyDoc }
  | { ok: true; via: 'bearer'; uid: string }
  | { ok: false; response: NextResponse }
> {
  if (request.headers.get('x-api-key') || /^ApiKey /i.test(request.headers.get('authorization') || '')) {
    const r = await verifyApiKey(request, opts);
    if (!r.ok) return r;
    return { ok: true, via: 'apiKey', key: r.key };
  }

  // Fall back to Firebase Bearer
  const { verifyAuth } = await import('./api-auth');
  const r = await verifyAuth(request);
  if (r.error) return { ok: false, response: r.error };
  return { ok: true, via: 'bearer', uid: r.uid! };
}
