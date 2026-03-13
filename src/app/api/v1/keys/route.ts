import { NextRequest } from 'next/server';
import { createApiKeyAdmin, listApiKeysAdmin } from '@/lib/api-key-admin';
import { ApiKeyScope, ALL_SCOPES } from '@/lib/api-key-utils';
import { withApiAuth, apiSuccess, apiError, ApiContext } from '@/lib/api-middleware';

async function GET(req: NextRequest, ctx: ApiContext) {
  const keys = await listApiKeysAdmin(ctx.ownerId);
  const safe = keys.map(({ keyHash, ...rest }: any) => rest);
  return apiSuccess(safe);
}

async function POST(req: NextRequest, ctx: ApiContext) {
  const body = await req.json().catch(() => ({}));
  const { label, scopes } = body;

  if (!label) return apiError('label is required.', 400);

  const resolvedScopes: ApiKeyScope[] =
    Array.isArray(scopes) && scopes.length > 0 ? scopes : ALL_SCOPES;

  const key = await createApiKeyAdmin(ctx.ownerId, label, resolvedScopes);
  return apiSuccess({
    apiKey: key.secret,
    keyId: key.id,
    keyPrefix: key.keyPrefix,
    label: key.label,
    scopes: key.scopes,
    note: 'Store this key securely — it will not be shown again.',
  }, 201);
}

export const GET_handler = withApiAuth(GET);
export const POST_handler = withApiAuth(POST);
export { GET_handler as GET, POST_handler as POST };
