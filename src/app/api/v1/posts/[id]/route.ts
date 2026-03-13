import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { withApiAuth, apiSuccess, apiError, ApiContext } from '@/lib/api-middleware';

async function GET(req: NextRequest, ctx: ApiContext, { params }: { params: { id: string } }) {
  const snap = await adminDb.collection('blogs').doc(params.id).get();
  if (!snap.exists) return apiError('Post not found.', 404);
  const data = snap.data()!;
  return apiSuccess({
    id: snap.id,
    ...data,
    createdAt: (data.createdAt as any)?.toDate?.()?.toISOString() ?? null,
  });
}

async function PUT(req: NextRequest, ctx: ApiContext, { params }: { params: { id: string } }) {
  const ref = adminDb.collection('blogs').doc(params.id);
  const snap = await ref.get();
  if (!snap.exists) return apiError('Post not found.', 404);
  if (snap.data()!.authorId !== ctx.ownerId) return apiError('Forbidden.', 403);

  const body = await req.json().catch(() => ({}));
  const updates: Record<string, any> = {};
  if ('title' in body) updates.title = body.title;
  if ('visibility' in body) updates.visibility = body.visibility;
  if ('text' in body) updates['content.text'] = body.text;
  if ('thumbnailUrl' in body) updates['content.thumbnailUrl'] = body.thumbnailUrl;

  if (!Object.keys(updates).length) return apiError('No valid fields to update.', 400);

  await ref.update(updates);
  return apiSuccess({ id: params.id, updated: true });
}

async function DELETE(req: NextRequest, ctx: ApiContext, { params }: { params: { id: string } }) {
  const ref = adminDb.collection('blogs').doc(params.id);
  const snap = await ref.get();
  if (!snap.exists) return apiError('Post not found.', 404);
  if (snap.data()!.authorId !== ctx.ownerId) return apiError('Forbidden.', 403);
  await ref.delete();
  return apiSuccess({ deleted: true, id: params.id });
}

export const GET_h = withApiAuth(GET, ['posts:read']);
export const PUT_h = withApiAuth(PUT, ['posts:write']);
export const DELETE_h = withApiAuth(DELETE, ['posts:write']);
export { GET_h as GET, PUT_h as PUT, DELETE_h as DELETE };
