import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api-auth';
import { getPlatformRoleForUid } from '@/lib/platform-role-server';

/**
 * GET /api/me/role
 *
 * Returns the calling user's platform role.
 *
 * Why this exists: workspaceMembers reads were tightened in firestore.rules
 * to prevent any-user privilege-escalation by reading or writing other
 * users' role records. The client-side `usePlatformRole` hook used to
 * query workspaceMembers directly; it now goes through this endpoint,
 * which uses the Admin SDK (bypassing rules) and returns only the
 * current user's role.
 *
 * Response: { role: 'admin' | 'owner' | 'community_creator' | 'read_only' | null }
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (auth.error) return auth.error;

  try {
    const role = await getPlatformRoleForUid(auth.uid!);
    return NextResponse.json({ role });
  } catch (error) {
    console.error('[api/me/role] error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve platform role' },
      { status: 500 }
    );
  }
}
