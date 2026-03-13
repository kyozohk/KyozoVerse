import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { withApiAuth, apiSuccess, apiError, paginate, ApiContext } from '@/lib/api-middleware';

async function GET(req: NextRequest, ctx: ApiContext) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

  const snap = await adminDb.collection('communities').where('ownerId', '==', ctx.ownerId).get();
  const communities = snap.docs.map(d => ({ communityId: d.id, ...d.data() }));
  const { items, pagination } = paginate(communities, page, limit);
  return apiSuccess({ communities: items, pagination });
}

async function POST(req: NextRequest, ctx: ApiContext) {
  const body = await req.json().catch(() => ({}));
  const { name, handle, tagline, description, isPrivate } = body;

  if (!name || !handle) return apiError('name and handle are required.', 400);

  const handleClean = handle.toLowerCase().replace(/[^a-z0-9-]/g, '-');

  const existing = await adminDb.collection('communities').where('handle', '==', handleClean).get();
  if (!existing.empty) return apiError(`Handle "${handleClean}" is already taken.`, 409);

  const communityData = {
    name,
    handle: handleClean,
    tagline: tagline || '',
    description: description || '',
    isPrivate: isPrivate || false,
    ownerId: ctx.ownerId,
    memberCount: 1,
    createdAt: FieldValue.serverTimestamp(),
  };

  const docRef = await adminDb.collection('communities').add(communityData);
  return apiSuccess({ communityId: docRef.id, ...communityData }, 201);
}

export const GET_handler = withApiAuth(GET, ['communities:read']);
export const POST_handler = withApiAuth(POST, ['communities:write']);
export { GET_handler as GET, POST_handler as POST };
