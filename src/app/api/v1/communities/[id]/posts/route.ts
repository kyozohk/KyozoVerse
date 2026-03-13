import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { withApiAuth, apiSuccess, apiError, paginate, ApiContext } from '@/lib/api-middleware';

async function GET(req: NextRequest, ctx: ApiContext, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const type = searchParams.get('type');

  const communitySnap = await adminDb.collection('communities').doc(params.id).get();
  if (!communitySnap.exists) return apiError('Community not found.', 404);

  let q = adminDb.collection('blogs').where('communityId', '==', params.id).orderBy('createdAt', 'desc') as any;
  if (type) q = adminDb.collection('blogs').where('communityId', '==', params.id).where('type', '==', type).orderBy('createdAt', 'desc');

  const snap = await q.get();
  const posts = snap.docs.map((d: any) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate?.()?.toISOString() ?? null,
  }));

  const { items, pagination } = paginate(posts, page, limit);
  return apiSuccess({ posts: items, pagination });
}

async function POST(req: NextRequest, ctx: ApiContext, { params }: { params: { id: string } }) {
  const communitySnap = await adminDb.collection('communities').doc(params.id).get();
  if (!communitySnap.exists) return apiError('Community not found.', 404);
  if (communitySnap.data()!.ownerId !== ctx.ownerId) return apiError('Forbidden.', 403);

  const body = await req.json().catch(() => ({}));
  const { title, type, text, mediaUrls, thumbnailUrl, fileType, visibility } = body;

  if (!type || !['text', 'image', 'audio', 'video', 'poll'].includes(type)) {
    return apiError('type must be one of: text, image, audio, video, poll.', 400);
  }
  if (!title) return apiError('title is required.', 400);

  const postData = {
    title,
    type,
    content: {
      text: text || '',
      mediaUrls: mediaUrls || [],
      thumbnailUrl: thumbnailUrl || null,
      fileType: fileType || null,
    },
    authorId: ctx.ownerId,
    communityId: params.id,
    communityHandle: communitySnap.data()!.handle,
    likes: 0,
    comments: 0,
    visibility: visibility || 'public',
    createdAt: FieldValue.serverTimestamp(),
  };

  const docRef = await adminDb.collection('blogs').add(postData);
  return apiSuccess({ id: docRef.id, postId: docRef.id, ...postData }, 201);
}

export const GET_h = withApiAuth(GET, ['posts:read']);
export const POST_h = withApiAuth(POST, ['posts:write']);
export { GET_h as GET, POST_h as POST };
