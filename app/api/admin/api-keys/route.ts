import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '@/firebase/admin';
import { verifyAuth } from '@/lib/api-auth';
import { isWorkspaceAdmin } from '@/lib/platform-role-server';
import {
  generateApiKey,
  API_KEYS_COLLECTION,
  type ApiKeyDoc,
} from '@/lib/api-key-auth';

/** Catalog of scopes the UI is allowed to grant. Keep in sync with v1 route checks. */
export const KNOWN_SCOPES = [
  'email:send',
  'email:setup-domain',
  'whatsapp:send',
  'whatsapp:read',
  'ai:generate',
  'broadcast:read',
  'broadcast:write',
  'communities:read',
  'waitlist:write',
  '*',
] as const;

type ListedKey = Omit<ApiKeyDoc, 'keyHash'> & {
  keyHash: string;
  status: 'active' | 'revoked';
};

async function requireAdmin(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (auth.error) return { error: auth.error };
  const ok = await isWorkspaceAdmin(auth.uid!);
  if (!ok) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden: workspace admin role required', code: 'FORBIDDEN' },
        { status: 403 }
      ),
    };
  }
  return { uid: auth.uid! };
}

/** GET /api/admin/api-keys — list all keys (does not return raw keys, only hashes/prefixes). */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (guard.error) return guard.error;

  try {
    const snap = await db
      .collection(API_KEYS_COLLECTION)
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get();

    const keys: ListedKey[] = snap.docs.map((d) => {
      const data = d.data() as ApiKeyDoc;
      return {
        ...data,
        keyHash: d.id,
        status: data.revokedAt ? 'revoked' : 'active',
      };
    });

    return NextResponse.json({ keys });
  } catch (e) {
    console.error('[admin/api-keys GET]', e);
    return NextResponse.json(
      { error: 'Failed to list keys', details: (e as Error).message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/api-keys
 * Body: { name: string, scopes: string[], ownerCommunity?: string }
 * Returns: { rawKey: string, prefix: string, keyHash: string, ... }
 *
 * IMPORTANT: rawKey is included exactly once in this response — it is never
 * returned again. The client must show it to the user immediately and then
 * discard it.
 */
export async function POST(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (guard.error) return guard.error;

  try {
    const body = await request.json();
    const name = (body?.name || '').toString().trim();
    const scopesIn: string[] = Array.isArray(body?.scopes) ? body.scopes : [];
    const ownerCommunity = body?.ownerCommunity || undefined;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required', code: 'MISSING_FIELD' },
        { status: 400 }
      );
    }
    if (scopesIn.length === 0) {
      return NextResponse.json(
        { error: 'At least one scope is required', code: 'MISSING_FIELD' },
        { status: 400 }
      );
    }
    const invalid = scopesIn.filter((s) => !KNOWN_SCOPES.includes(s as (typeof KNOWN_SCOPES)[number]));
    if (invalid.length) {
      return NextResponse.json(
        {
          error: `Unknown scope(s): ${invalid.join(', ')}`,
          code: 'INVALID_SCOPE',
          known: KNOWN_SCOPES,
        },
        { status: 400 }
      );
    }

    const { rawKey, prefix, keyHash } = generateApiKey();

    const doc: Record<string, unknown> = {
      keyHash,
      prefix,
      name,
      scopes: scopesIn,
      ownerUid: guard.uid,
      createdAt: FieldValue.serverTimestamp(),
    };
    if (ownerCommunity) doc.ownerCommunity = ownerCommunity;

    await db.collection(API_KEYS_COLLECTION).doc(keyHash).set(doc);

    return NextResponse.json(
      {
        rawKey, // shown exactly once
        keyHash,
        prefix,
        name,
        scopes: scopesIn,
        ownerCommunity: ownerCommunity || null,
      },
      { status: 201 }
    );
  } catch (e) {
    console.error('[admin/api-keys POST]', e);
    return NextResponse.json(
      { error: 'Failed to mint key', details: (e as Error).message },
      { status: 500 }
    );
  }
}
