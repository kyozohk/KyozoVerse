import { NextRequest, NextResponse } from 'next/server';
import { validateApiKeyAdmin } from './api-key-admin';
import { extractBearerToken, requireScopes, ApiKey, ApiKeyScope } from './api-key-utils';

export type ApiContext = {
  apiKey: ApiKey;
  ownerId: string;
};

export type ApiHandler = (req: NextRequest, ctx: ApiContext, params?: any) => Promise<NextResponse>;

export function withApiAuth(handler: ApiHandler, requiredScopes: ApiKeyScope[] = []) {
  return async (req: NextRequest, params?: any): Promise<NextResponse> => {
    const authHeader = req.headers.get('authorization');
    const xApiKey = req.headers.get('x-api-key');

    const raw = extractBearerToken(authHeader) || xApiKey;

    if (!raw) {
      return NextResponse.json(
        { error: 'Missing API key. Provide via Authorization: Bearer <key> or x-api-key header.' },
        { status: 401 }
      );
    }

    let apiKey: ApiKey | null = null;
    try {
      apiKey = await validateApiKeyAdmin(raw);
    } catch (err) {
      console.error('API key validation error:', err);
      return NextResponse.json({ error: 'Internal server error during authentication.' }, { status: 500 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'Invalid or revoked API key.' }, { status: 401 });
    }

    if (requiredScopes.length > 0 && !requireScopes(apiKey, requiredScopes)) {
      return NextResponse.json(
        {
          error: 'Insufficient permissions.',
          required: requiredScopes,
          granted: apiKey.scopes,
        },
        { status: 403 }
      );
    }

    const ctx: ApiContext = { apiKey, ownerId: apiKey.ownerId };
    return handler(req, ctx, params);
  };
}

export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400, details?: any): NextResponse {
  return NextResponse.json({ success: false, error: message, ...(details ? { details } : {}) }, { status });
}

export function paginate<T>(items: T[], page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const sliced = items.slice(offset, offset + limit);
  return {
    items: sliced,
    pagination: {
      page,
      limit,
      total: items.length,
      totalPages: Math.ceil(items.length / limit),
      hasNext: offset + limit < items.length,
      hasPrev: page > 1,
    },
  };
}
