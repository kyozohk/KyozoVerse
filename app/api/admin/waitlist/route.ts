import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { requireWorkspaceAdmin } from '@/lib/api-auth';

/**
 * GET /api/admin/waitlist
 *
 * Returns all waitlist / accessRequest documents. Admin-only.
 * Replaces the previous direct Firestore onSnapshot reads in the
 * `/waitlist` admin page (those reads are now blocked by the
 * tightened firestore.rules).
 *
 * Query params:
 *   collection: 'waitlist' | 'accessRequests' (default: 'waitlist')
 */
export async function GET(request: NextRequest) {
  const guard = await requireWorkspaceAdmin(request);
  if (guard.error) return guard.error;

  const url = new URL(request.url);
  const collectionName = url.searchParams.get('collection') === 'accessRequests'
    ? 'accessRequests'
    : 'waitlist';

  try {
    const snap = await db.collection(collectionName).orderBy('createdAt', 'desc').limit(1000).get();
    const requests = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ requests });
  } catch (error) {
    console.error('[admin/waitlist GET] error:', error);
    return NextResponse.json(
      { error: 'Failed to list waitlist' },
      { status: 500 }
    );
  }
}
