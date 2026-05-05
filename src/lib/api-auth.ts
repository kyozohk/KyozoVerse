import { NextRequest, NextResponse } from 'next/server';
import { auth as adminAuth } from '@/firebase/admin';
import { isWorkspaceAdmin } from '@/lib/platform-role-server';

/**
 * Verify Firebase auth token from request headers.
 * Returns the decoded token if valid, or a 401 response if not.
 *
 * Usage in API routes:
 *   const authResult = await verifyAuth(request);
 *   if (authResult.error) return authResult.error;
 *   const userId = authResult.uid;
 */
export async function verifyAuth(request: NextRequest): Promise<{ uid?: string; error?: NextResponse }> {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        error: NextResponse.json(
          { error: 'Unauthorized: Missing or invalid authorization header' },
          { status: 401 }
        ),
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = await adminAuth.verifyIdToken(token);

    if (!decoded || !decoded.uid) {
      return {
        error: NextResponse.json(
          { error: 'Unauthorized: Invalid token' },
          { status: 401 }
        ),
      };
    }

    return { uid: decoded.uid };
  } catch (error) {
    console.error('Auth verification error:', error);
    return {
      error: NextResponse.json(
        { error: 'Unauthorized: Token verification failed' },
        { status: 401 }
      ),
    };
  }
}

/**
 * Verify the request comes from an authenticated user AND that user has the
 * workspace `admin` or `owner` platform role. Use on routes that mutate
 * platform-wide state (waitlist approvals, team management, super-admin actions).
 *
 * Returns either { uid } on success or { error: NextResponse } on failure.
 */
export async function requireWorkspaceAdmin(
  request: NextRequest
): Promise<{ uid?: string; error?: NextResponse }> {
  const authResult = await verifyAuth(request);
  if (authResult.error) return authResult;
  const ok = await isWorkspaceAdmin(authResult.uid!);
  if (!ok) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden: workspace admin role required', code: 'FORBIDDEN' },
        { status: 403 }
      ),
    };
  }
  return { uid: authResult.uid };
}

/**
 * Rate limiting helper (simple in-memory, per-IP).
 * For production, use Redis or a proper rate limiter.
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(request: NextRequest, maxRequests = 10, windowMs = 60000): NextResponse | null {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const now = Date.now();

  const entry = rateLimitMap.get(ip);
  if (entry && now < entry.resetAt) {
    if (entry.count >= maxRequests) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    entry.count++;
  } else {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
  }

  // Cleanup old entries periodically
  if (rateLimitMap.size > 10000) {
    for (const [key, val] of rateLimitMap) {
      if (now > val.resetAt) rateLimitMap.delete(key);
    }
  }

  return null;
}
