import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { createApiKeyAdmin } from '@/lib/api-key-admin';
import { ALL_SCOPES, ApiKeyScope } from '@/lib/api-key-utils';
import { apiSuccess, apiError } from '@/lib/api-middleware';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken, label, scopes } = body;

    if (!idToken) {
      return apiError('idToken is required. Sign in with Firebase and pass the ID token.', 400);
    }

    let decoded: any;
    try {
      decoded = await adminAuth.verifyIdToken(idToken);
    } catch {
      return apiError('Invalid or expired Firebase ID token.', 401);
    }

    const resolvedScopes: ApiKeyScope[] = Array.isArray(scopes) && scopes.length > 0
      ? scopes as ApiKeyScope[]
      : ALL_SCOPES;

    const keyWithSecret = await createApiKeyAdmin(
      decoded.uid,
      label || `API Key — ${new Date().toLocaleDateString()}`,
      resolvedScopes
    );

    return apiSuccess({
      apiKey: keyWithSecret.secret,
      keyId: keyWithSecret.id,
      keyPrefix: keyWithSecret.keyPrefix,
      label: keyWithSecret.label,
      scopes: keyWithSecret.scopes,
      ownerId: keyWithSecret.ownerId,
      note: 'Store this key securely — it will not be shown again.',
    }, 201);
  } catch (err) {
    console.error('[POST /api/v1/auth/login]', err);
    return apiError('Internal server error.', 500);
  }
}
