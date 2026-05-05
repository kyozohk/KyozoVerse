import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '@/firebase/admin';
import { verifyAuth } from '@/lib/api-auth';
import { isWorkspaceAdmin } from '@/lib/platform-role-server';
import { API_KEYS_COLLECTION } from '@/lib/api-key-auth';

/**
 * POST /api/admin/api-keys/:keyHash/revoke
 * Marks an API key as revoked. The doc remains for audit; verifyApiKey()
 * rejects any request using it.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ keyHash: string }> }
) {
  const auth = await verifyAuth(request);
  if (auth.error) return auth.error;
  if (!(await isWorkspaceAdmin(auth.uid!))) {
    return NextResponse.json(
      { error: 'Forbidden: workspace admin role required', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }

  try {
    const { keyHash } = await params;
    if (!keyHash) {
      return NextResponse.json(
        { error: 'Missing keyHash', code: 'MISSING_FIELD' },
        { status: 400 }
      );
    }
    const ref = db.collection(API_KEYS_COLLECTION).doc(keyHash);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json(
        { error: 'API key not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    await ref.update({
      revokedAt: FieldValue.serverTimestamp(),
      revokedBy: auth.uid,
    });
    return NextResponse.json({ ok: true, keyHash });
  } catch (e) {
    console.error('[admin/api-keys/[keyHash]/revoke]', e);
    return NextResponse.json(
      { error: 'Failed to revoke key', details: (e as Error).message },
      { status: 500 }
    );
  }
}
