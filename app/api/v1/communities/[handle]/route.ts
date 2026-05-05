import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { verifyApiKeyOrBearer } from '@/lib/api-key-auth';

/** GET /api/v1/communities/:handle — fetch a community by its handle. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const auth = await verifyApiKeyOrBearer(request, { scope: 'communities:read' });
  if (!auth.ok) return auth.response;

  try {
    const { handle } = await params;
    if (!handle) {
      return NextResponse.json({ error: 'Missing handle', code: 'MISSING_FIELD' }, { status: 400 });
    }

    const snap = await db
      .collection('communities')
      .where('handle', '==', handle)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ error: 'Community not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const doc = snap.docs[0];
    return NextResponse.json({ community: { id: doc.id, ...doc.data() } });
  } catch (e) {
    console.error('[v1/communities/[handle] GET]', e);
    return NextResponse.json(
      { error: 'Failed to fetch community', details: (e as Error).message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
