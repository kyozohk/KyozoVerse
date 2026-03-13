import { NextRequest } from 'next/server';
import { revokeApiKeyAdmin } from '@/lib/api-key-admin';
import { withApiAuth, apiSuccess, apiError, ApiContext } from '@/lib/api-middleware';

async function DELETE(req: NextRequest, ctx: ApiContext, { params }: { params: { keyId: string } }) {
  const { keyId } = params;
  const revoked = await revokeApiKeyAdmin(keyId, ctx.ownerId);
  if (!revoked) return apiError('Key not found or not owned by you.', 404);
  return apiSuccess({ revoked: true, keyId });
}

export const DELETE_handler = withApiAuth(DELETE);
export { DELETE_handler as DELETE };
