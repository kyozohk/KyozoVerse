/**
 * GET /api/v1/connectors/:provider/callback?code=…&state=…
 *
 * OAuth callback. Validates the state token (CSRF + tampering), exchanges
 * the code for tokens at the provider, encrypts and stores them in
 * `sourceConnections`, then 302s the user back into /onboard/integrate
 * with a success flag.
 *
 * Security:
 *   - state is encrypted+authenticated and TTL-bounded (10 min). A stolen
 *     code without a valid state is rejected.
 *   - access tokens are never persisted in plaintext.
 *   - errors don't leak provider-side error bodies to the redirect URL.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PROVIDERS, storeSourceConnection } from '@/lib/v2/connectors';
import { verifyOauthState } from '@/lib/v2/encryption';

function fail(request: NextRequest, msg: string) {
  const back = new URL('/onboard/integrate', request.nextUrl.origin);
  back.searchParams.set('connector_error', msg);
  return NextResponse.redirect(back.toString());
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const cfg = PROVIDERS[provider];
  if (!cfg || !cfg.tokenUrl || !cfg.clientIdEnv || !cfg.clientSecretEnv) {
    return fail(request, 'unknown_or_unsupported_provider');
  }

  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const errorParam = request.nextUrl.searchParams.get('error');

  if (errorParam) return fail(request, `provider:${errorParam}`);
  if (!code || !state) return fail(request, 'missing_code_or_state');

  const stateData = verifyOauthState(state, provider);
  if (!stateData) return fail(request, 'invalid_or_expired_state');

  const clientId = process.env[cfg.clientIdEnv];
  const clientSecret = process.env[cfg.clientSecretEnv];
  if (!clientId || !clientSecret) return fail(request, 'connector_not_configured');

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    `${request.nextUrl.protocol}//${request.nextUrl.host}`;
  const redirectUri = `${appUrl.replace(/\/$/, '')}/api/v1/connectors/${provider}/callback`;

  // Exchange code → token
  const tokenParams = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'application/json',
  };
  if (cfg.tokenAuth === 'body' || !cfg.tokenAuth) {
    tokenParams.set('client_id', clientId);
    tokenParams.set('client_secret', clientSecret);
  } else {
    headers.Authorization =
      'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  }

  let tokenRes: Response;
  try {
    tokenRes = await fetch(cfg.tokenUrl, {
      method: 'POST',
      headers,
      body: tokenParams.toString(),
    });
  } catch {
    return fail(request, 'provider_unreachable');
  }
  if (!tokenRes.ok) return fail(request, 'token_exchange_failed');
  const tok = (await tokenRes.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  };
  if (!tok.access_token) return fail(request, 'token_exchange_no_token');

  try {
    await storeSourceConnection({
      workspaceId: stateData.workspaceId,
      ownerUid: stateData.uid,
      provider: cfg.provider,
      rawAccessToken: tok.access_token,
      rawRefreshToken: tok.refresh_token,
      scopes: tok.scope ? tok.scope.split(' ') : cfg.scopes,
      expiresInSec: tok.expires_in,
    });
  } catch (e) {
    console.error('[connector callback] storeSourceConnection failed:', e);
    return fail(request, 'storage_failed');
  }

  const back = new URL('/onboard/integrate', request.nextUrl.origin);
  back.searchParams.set('connector_added', provider);
  return NextResponse.redirect(back.toString());
}
