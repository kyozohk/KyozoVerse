import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyAuth } from '@/lib/api-auth';
import { isWorkspaceAdmin } from '@/lib/platform-role-server';

const VALID_ROLES = ['admin', 'owner', 'community_creator', 'read_only'] as const;
type Role = (typeof VALID_ROLES)[number];

async function requireWorkspaceAdmin(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (auth.error) return { error: auth.error };
  const ok = await isWorkspaceAdmin(auth.uid!);
  if (!ok) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden: workspace admin role required', code: 'FORBIDDEN' },
        { status: 403 }
      ),
    };
  }
  return { uid: auth.uid! };
}

/**
 * GET /api/admin/workspace-members
 * List all workspace members. Admin-only.
 */
export async function GET(request: NextRequest) {
  const guard = await requireWorkspaceAdmin(request);
  if (guard.error) return guard.error;

  try {
    const snap = await db
      .collection('workspaceMembers')
      .orderBy('createdAt', 'desc')
      .limit(500)
      .get();
    const members = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ members });
  } catch (error) {
    console.error('[admin/workspace-members GET] error:', error);
    return NextResponse.json(
      { error: 'Failed to list workspace members' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/workspace-members
 * Body: { email: string, displayName: string, role: Role }
 * Creates a pending invite. Admin-only.
 */
export async function POST(request: NextRequest) {
  const guard = await requireWorkspaceAdmin(request);
  if (guard.error) return guard.error;

  try {
    const body = await request.json();
    const email = (body?.email || '').toString().trim().toLowerCase();
    const displayName = (body?.displayName || '').toString().trim();
    const role = (body?.role || '').toString().trim() as Role;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }
    if (!displayName) {
      return NextResponse.json({ error: 'Display name required' }, { status: 400 });
    }
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` },
        { status: 400 }
      );
    }

    // Reject duplicates
    const existing = await db
      .collection('workspaceMembers')
      .where('email', '==', email)
      .where('status', 'in', ['pending', 'active'])
      .limit(1)
      .get();
    if (!existing.empty) {
      return NextResponse.json(
        { error: 'This email already has an active or pending invitation' },
        { status: 409 }
      );
    }

    const docRef = await db.collection('workspaceMembers').add({
      email,
      displayName,
      userId: null,
      role,
      status: 'pending',
      invitedBy: guard.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const created = await docRef.get();
    return NextResponse.json({ id: docRef.id, ...created.data() }, { status: 201 });
  } catch (error) {
    console.error('[admin/workspace-members POST] error:', error);
    return NextResponse.json(
      { error: 'Failed to create workspace invite' },
      { status: 500 }
    );
  }
}
