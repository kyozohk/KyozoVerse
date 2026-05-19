/**
 * GET /api/v1/connectors/:provider/connect
 *
 * Start an OAuth flow. Validates the caller's workspace, mints a signed
 * state token tying the callback to this user + workspace + provider,
 * and 302s to the provider's authorize URL.
 *
 * The state token is encrypted+authenticated (AES-256-GCM via
 * src/lib/v2/encryption.ts) so a callback can't be forged by a third party
 * and can't be replayed past its 10-minute TTL.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireWorkspace } from '@/lib/v2/workspace';
import { PROVIDERS } from '@/lib/v2/connectors';
import { signOauthState } from '@/lib/v2/encryption';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const cfg = PROVIDERS[provider];
  if (!cfg) {
    return NextResponse.json(
      { error: `Unknown connector: ${provider}`, code: 'NOT_FOUND' },
      { status: 404 }
    );
  }
  if (cfg.status === 'coming_soon') {
    return NextResponse.json(
      { error: `${cfg.label} is not yet available`, code: 'COMING_SOON' },
      { status: 501 }
    );
  }
  if (!cfg.authorizeUrl || !cfg.clientIdEnv) {
    return NextResponse.json(
      { error: `Connector ${provider} is not an OAuth provider`, code: 'UNSUPPORTED' },
      { status: 400 }
    );
  }

  const ws = await requireWorkspace(request, { minRole: 'admin' });
  if (!ws.ok) return ws.response;
  const { workspaceId, uid } = ws.ctx;

  const clientId = process.env[cfg.clientIdEnv];
  if (!clientId) {
    return NextResponse.json(
      {
        error: `Connector ${provider} is not configured (missing ${cfg.clientIdEnv})`,
        code: 'NOT_CONFIGURED',
      },
      { status: 500 }
    );
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    `${request.nextUrl.protocol}//${request.nextUrl.host}`;
  const redirectUri = `${appUrl.replace(/\/$/, '')}/api/v1/connectors/${provider}/callback`;

  const state = signOauthState({ workspaceId, uid, provider });

  const url = new URL(cfg.authorizeUrl);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  if (cfg.scopes && cfg.scopes.length > 0) {
    url.searchParams.set('scope', cfg.scopes.join(' '));
  }
  url.searchParams.set('state', state);
  for (const [k, v] of Object.entries(cfg.authorizeExtra || {})) {
    url.searchParams.set(k, v);
  }

  return NextResponse.redirect(url.toString());
}
