import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { withApiAuth, apiSuccess, apiError, paginate, ApiContext } from '@/lib/api-middleware';

async function GET(req: NextRequest, ctx: ApiContext, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const search = searchParams.get('search') || '';

  const communitySnap = await adminDb.collection('communities').doc(params.id).get();
  if (!communitySnap.exists) return apiError('Community not found.', 404);

  const snap = await adminDb.collection('communityMembers').where('communityId', '==', params.id).get();
  let members = snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    joinedAt: (d.data().joinedAt as any)?.toDate?.()?.toISOString() ?? null,
  }));

  if (search) {
    const q = search.toLowerCase();
    members = members.filter((m: any) =>
      m.userDetails?.displayName?.toLowerCase().includes(q) ||
      m.userDetails?.email?.toLowerCase().includes(q)
    );
  }

  const { items, pagination } = paginate(members, page, limit);
  return apiSuccess({ members: items, pagination });
}

async function POST(req: NextRequest, ctx: ApiContext, { params }: { params: { id: string } }) {
  const communitySnap = await adminDb.collection('communities').doc(params.id).get();
  if (!communitySnap.exists) return apiError('Community not found.', 404);
  if (communitySnap.data()!.ownerId !== ctx.ownerId) return apiError('Forbidden.', 403);

  const body = await req.json().catch(() => ({}));
  const { userId, displayName, email, phone, role } = body;
  if (!userId) return apiError('userId is required.', 400);

  const docId = `${userId}_${params.id}`;
  const existing = await adminDb.collection('communityMembers').doc(docId).get();
  if (existing.exists) return apiError('User is already a member.', 409);

  await adminDb.collection('communityMembers').doc(docId).set({
    userId,
    communityId: params.id,
    role: role || 'member',
    joinedAt: FieldValue.serverTimestamp(),
    status: 'active',
    userDetails: { displayName: displayName || '', email: email || '', phone: phone || '' },
  });
  await adminDb.collection('communities').doc(params.id).update({ memberCount: FieldValue.increment(1) });

  return apiSuccess({ added: true, memberId: docId, userId, communityId: params.id }, 201);
}

async function DELETE(req: NextRequest, ctx: ApiContext, { params }: { params: { id: string } }) {
  const communitySnap = await adminDb.collection('communities').doc(params.id).get();
  if (!communitySnap.exists) return apiError('Community not found.', 404);
  if (communitySnap.data()!.ownerId !== ctx.ownerId) return apiError('Forbidden.', 403);

  const body = await req.json().catch(() => ({}));
  const { userId } = body;
  if (!userId) return apiError('userId is required.', 400);

  const docId = `${userId}_${params.id}`;
  const existing = await adminDb.collection('communityMembers').doc(docId).get();
  if (!existing.exists) return apiError('Member not found.', 404);

  await adminDb.collection('communityMembers').doc(docId).delete();
  await adminDb.collection('communities').doc(params.id).update({ memberCount: FieldValue.increment(-1) });

  return apiSuccess({ removed: true, userId, communityId: params.id });
}

export const GET_h = withApiAuth(GET, ['members:read']);
export const POST_h = withApiAuth(POST, ['members:write']);
export const DELETE_h = withApiAuth(DELETE, ['members:write']);
export { GET_h as GET, POST_h as POST, DELETE_h as DELETE };
