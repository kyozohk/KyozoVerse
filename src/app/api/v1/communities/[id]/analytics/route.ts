import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { withApiAuth, apiSuccess, apiError, ApiContext } from '@/lib/api-middleware';

async function GET(req: NextRequest, ctx: ApiContext, { params }: { params: { id: string } }) {
  const communitySnap = await adminDb.collection('communities').doc(params.id).get();
  if (!communitySnap.exists) return apiError('Community not found.', 404);

  const [postsSnap, membersSnap] = await Promise.all([
    adminDb.collection('blogs').where('communityId', '==', params.id).get(),
    adminDb.collection('communityMembers').where('communityId', '==', params.id).get(),
  ]);

  const posts = postsSnap.docs.map(d => d.data());
  const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.comments || 0), 0);

  const byType = posts.reduce((acc: Record<string, number>, p) => {
    acc[p.type] = (acc[p.type] || 0) + 1;
    return acc;
  }, {});

  const topPosts = posts
    .sort((a, b) => (b.likes || 0) - (a.likes || 0))
    .slice(0, 5)
    .map(p => ({ title: p.title, type: p.type, likes: p.likes || 0, comments: p.comments || 0 }));

  return apiSuccess({
    communityId: params.id,
    communityName: communitySnap.data()!.name,
    overview: {
      totalPosts: posts.length,
      totalMembers: membersSnap.size,
      totalLikes,
      totalComments,
    },
    postsByType: byType,
    topPosts,
  });
}

export const GET_h = withApiAuth(GET, ['analytics:read']);
export { GET_h as GET };
