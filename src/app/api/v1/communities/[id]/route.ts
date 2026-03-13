import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { withApiAuth, apiSuccess, apiError, ApiContext } from '@/lib/api-middleware';

async function GET(req: NextRequest, ctx: ApiContext, { params }: { params: { id: string } }) {
  const snap = await adminDb.collection('communities').doc(params.id).get();
  if (!snap.exists) return apiError('Community not found.', 404);
  return apiSuccess({ communityId: snap.id, ...snap.data() });
}

async function PUT(req: NextRequest, ctx: ApiContext, { params }: { params: { id: string } }) {
  const ref = adminDb.collection('communities').doc(params.id);
  const snap = await ref.get();
  if (!snap.exists) return apiError('Community not found.', 404);
  if (snap.data()!.ownerId !== ctx.ownerId) return apiError('Forbidden.', 403);

  const body = await req.json().catch(() => ({}));
  const allowed = ['name', 'tagline', 'description', 'isPrivate', 'mantras', 'lore'];
  const updates: Record<string, any> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }
  if (!Object.keys(updates).length) return apiError('No valid fields to update.', 400);

  await ref.update(updates);
  return apiSuccess({ communityId: params.id, ...snap.data(), ...updates });
}

async function DELETE(req: NextRequest, ctx: ApiContext, { params }: { params: { id: string } }) {
  const ref = adminDb.collection('communities').doc(params.id);
  const snap = await ref.get();
  if (!snap.exists) return apiError('Community not found.', 404);
  if (snap.data()!.ownerId !== ctx.ownerId) return apiError('Forbidden.', 403);
  await ref.delete();
  return apiSuccess({ deleted: true, communityId: params.id });
}

export const GET_h = withApiAuth(GET, ['communities:read']);
export const PUT_h = withApiAuth(PUT, ['communities:write']);
export const DELETE_h = withApiAuth(DELETE, ['communities:write']);
export { GET_h as GET, PUT_h as PUT, DELETE_h as DELETE };
