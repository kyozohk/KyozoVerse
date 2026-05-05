import { NextRequest, NextResponse } from 'next/server';

/**
 * CORS for the public API surface.
 *
 * The dev portal at developers.kyozo.com (and any allow-listed origin) calls
 * /api/v1/* (try-it-out) and /api/admin/* (key management) across origin.
 *
 * Allow-list is configured via the KYOZO_ALLOWED_ORIGINS env var as a
 * comma-separated list. The first-party origin (pro.kyozo.com itself) makes
 * same-origin calls and never sets an Origin header that needs allowing.
 */

function parseAllowedOrigins(): string[] {
  const raw = process.env.KYOZO_ALLOWED_ORIGINS || '';
  const fromEnv = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  // Default: allow the dev portal in prod and on localhost during development.
  const defaults = [
    'https://developers.kyozo.com',
    'http://localhost:9100',
    'http://localhost:3000',
  ];
  return Array.from(new Set([...defaults, ...fromEnv]));
}

function corsHeadersFor(origin: string | null): Record<string, string> {
  const allowed = parseAllowedOrigins();
  if (origin && allowed.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, x-api-key, X-Requested-With',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    };
  }
  return {};
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isV1 = pathname.startsWith('/api/v1/');
  const isAdmin = pathname.startsWith('/api/admin/');
  if (!isV1 && !isAdmin) return NextResponse.next();

  const origin = request.headers.get('origin');

  // Preflight
  if (request.method === 'OPTIONS') {
    const headers = corsHeadersFor(origin);
    if (!headers['Access-Control-Allow-Origin']) {
      return new NextResponse(null, { status: 403 });
    }
    return new NextResponse(null, { status: 204, headers });
  }

  // Forward request, then add CORS headers to the response.
  const response = NextResponse.next();
  const headers = corsHeadersFor(origin);
  for (const [k, v] of Object.entries(headers)) {
    response.headers.set(k, v);
  }
  return response;
}

export const config = {
  matcher: ['/api/v1/:path*', '/api/admin/:path*'],
};
