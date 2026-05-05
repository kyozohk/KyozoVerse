import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyAuth } from '@/lib/api-auth';
import { isWorkspaceAdmin } from '@/lib/platform-role-server';

const VALID_ROLES = ['admin', 'owner', 'community_creator', 'read_only'] as const;
const VALID_STATUSES = ['pending', 'active', 'revoked'] as const;
type Role = (typeof VALID_ROLES)[number];
type Status = (typeof VALID_STATUSES)[number];

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
 * PATCH /api/admin/workspace-members/[id]
 * Body: { role?: Role, status?: Status }
 * Updates a workspace member's role or status. Admin-only.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requireWorkspaceAdmin(request);
  if (guard.error) return guard.error;

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'Member id required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };

    if (body.role !== undefined) {
      if (!VALID_ROLES.includes(body.role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      update.role = body.role as Role;
    }
    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      update.status = body.status as Status;
      // Reactivation flow: status going back to 'pending' clears userId so the
      // recipient can re-claim with their current Firebase Auth uid.
      if (body.status === 'pending') {
        update.userId = null;
      }
    }

    if (Object.keys(update).length === 1) {
      return NextResponse.json(
        { error: 'Provide at least one of: role, status' },
        { status: 400 }
      );
    }

    const ref = db.collection('workspaceMembers').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Don't let the last active admin remove themselves.
    if (
      update.status === 'revoked' || update.role && update.role !== 'admin' && update.role !== 'owner'
    ) {
      const data = snap.data();
      if (
        data?.userId === guard.uid &&
        (data?.role === 'admin' || data?.role === 'owner')
      ) {
        const remaining = await db
          .collection('workspaceMembers')
          .where('status', '==', 'active')
          .where('role', 'in', ['admin', 'owner'])
          .get();
        if (remaining.size <= 1) {
          return NextResponse.json(
            {
              error: 'Cannot demote/revoke the last active workspace admin. Promote another admin first.',
            },
            { status: 400 }
          );
        }
      }
    }

    await ref.update(update);
    const updated = await ref.get();
    return NextResponse.json({ id, ...updated.data() });
  } catch (error) {
    console.error('[admin/workspace-members PATCH] error:', error);
    return NextResponse.json(
      { error: 'Failed to update workspace member' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/workspace-members/[id]
 * Hard-delete a workspace member entry. Admin-only. (Prefer PATCH to status='revoked'.)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requireWorkspaceAdmin(request);
  if (guard.error) return guard.error;

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'Member id required' }, { status: 400 });
  }

  try {
    const ref = db.collection('workspaceMembers').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
    const data = snap.data();
    if (data?.userId === guard.uid) {
      return NextResponse.json(
        { error: 'Cannot delete your own workspace membership' },
        { status: 400 }
      );
    }
    await ref.delete();
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error('[admin/workspace-members DELETE] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete workspace member' },
      { status: 500 }
    );
  }
}
