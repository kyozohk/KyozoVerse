import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { verifyApiKeyOrBearer } from '@/lib/api-key-auth';

/**
 * GET /api/v1/communities/:handle/members
 *
 * Query params:
 *   limit  (default 50, max 200)
 *   cursor (last memberId from a previous response, for pagination)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const auth = await verifyApiKeyOrBearer(request, { scope: 'communities:read' });
  if (!auth.ok) return auth.response;

  try {
    const { handle } = await params;
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 200);
    const cursor = url.searchParams.get('cursor');

    // Resolve handle -> communityId
    const cSnap = await db
      .collection('communities')
      .where('handle', '==', handle)
      .limit(1)
      .get();
    if (cSnap.empty) {
      return NextResponse.json({ error: 'Community not found', code: 'NOT_FOUND' }, { status: 404 });
    }
    const communityId = cSnap.docs[0].id;

    let q = db
      .collection('communityMembers')
      .where('communityId', '==', communityId)
      .orderBy('__name__')
      .limit(limit);

    if (cursor) q = q.startAfter(cursor);

    const mSnap = await q.get();
    const members = mSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const nextCursor = mSnap.docs.length === limit ? mSnap.docs[mSnap.docs.length - 1].id : null;

    return NextResponse.json({ communityId, handle, members, nextCursor });
  } catch (e) {
    console.error('[v1/communities/[handle]/members GET]', e);
    return NextResponse.json(
      { error: 'Failed to fetch members', details: (e as Error).message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
