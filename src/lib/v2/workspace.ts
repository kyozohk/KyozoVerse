/**
 * Workspace resolver — server-side only.
 *
 * Every v2 server route must call `requireWorkspace()` to:
 *   1. Authenticate the caller (Firebase Bearer)
 *   2. Resolve their workspace
 *   3. Verify their role
 *   4. Receive a stamped `workspaceId` to attach to every write
 *
 * NEVER trust a client-supplied `workspaceId` in a request body. Always
 * resolve it from the authenticated user on the server.
 *
 * Note: on the onboard branch we authenticate only via Firebase Bearer.
 * The api-key path (for external/MCP) lives on a separate branch; when
 * those branches merge, this resolver gets an `apiKey` arm added.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { verifyAuth } from '@/lib/api-auth';
import { COLLECTIONS, type WorkspaceRole, type Workspace } from './types';

export type WorkspaceContext = {
  workspaceId: string;
  workspace: Workspace;
  uid: string;
  /** Caller's role inside the workspace. */
  role: WorkspaceRole;
};

export type WorkspaceAuthOk = { ok: true; ctx: WorkspaceContext };
export type WorkspaceAuthErr = { ok: false; response: NextResponse };

/**
 * Resolve a user uid to their primary workspace.
 *
 * Precedence:
 *   1. If user owns a workspace doc, that workspace.
 *   2. Else first active workspaceMembers entry.
 *   3. Else null (user has no workspace yet — pre-onboarding).
 */
export async function getWorkspaceForUid(
  uid: string
): Promise<{ workspaceId: string; role: WorkspaceRole; workspace: Workspace } | null> {
  // 1) Owned workspace
  const ownedSnap = await db
    .collection(COLLECTIONS.workspaces)
    .where('ownerUid', '==', uid)
    .limit(1)
    .get();
  if (!ownedSnap.empty) {
    const w = ownedSnap.docs[0].data() as Workspace;
    return { workspaceId: w.workspaceId, role: 'owner', workspace: w };
  }

  // 2) Active member of a workspace
  const memberSnap = await db
    .collection(COLLECTIONS.workspaceMembers)
    .where('userId', '==', uid)
    .where('status', '==', 'active')
    .limit(1)
    .get();
  if (!memberSnap.empty) {
    const m = memberSnap.docs[0].data() as {
      workspaceId: string;
      role: WorkspaceRole;
    };
    const wSnap = await db
      .collection(COLLECTIONS.workspaces)
      .doc(m.workspaceId)
      .get();
    if (wSnap.exists) {
      return {
        workspaceId: m.workspaceId,
        role: m.role,
        workspace: wSnap.data() as Workspace,
      };
    }
  }

  return null;
}

/**
 * Auth + workspace resolution for v2 routes.
 *
 * Usage:
 *   const r = await requireWorkspace(request);
 *   if (!r.ok) return r.response;
 *   const { workspaceId, role } = r.ctx;
 *
 *   // With minimum role:
 *   const r = await requireWorkspace(request, { minRole: 'admin' });
 */
export async function requireWorkspace(
  request: NextRequest,
  opts: { minRole?: WorkspaceRole } = {}
): Promise<WorkspaceAuthOk | WorkspaceAuthErr> {
  const auth = await verifyAuth(request);
  if (auth.error) return { ok: false, response: auth.error };
  const uid = auth.uid!;

  const resolved = await getWorkspaceForUid(uid);

  if (!resolved) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error:
            'Caller has no workspace. Complete onboarding at /onboard or provision a workspace first.',
          code: 'NO_WORKSPACE',
        },
        { status: 409 }
      ),
    };
  }

  if (opts.minRole) {
    const ladder: WorkspaceRole[] = ['read_only', 'community_creator', 'admin', 'owner'];
    if (ladder.indexOf(resolved.role) < ladder.indexOf(opts.minRole)) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error: `Requires workspace role ${opts.minRole}; caller is ${resolved.role}.`,
            code: 'INSUFFICIENT_WORKSPACE_ROLE',
          },
          { status: 403 }
        ),
      };
    }
  }

  return {
    ok: true,
    ctx: {
      workspaceId: resolved.workspaceId,
      workspace: resolved.workspace,
      role: resolved.role,
      uid,
    },
  };
}

/**
 * Create the initial workspace for a user finishing onboarding. Idempotent:
 * if the user already owns a workspace, returns it unchanged.
 *
 * The workspaceId defaults to the owner uid for stability across migrations;
 * a generated id can be supplied for fresh signups if uid-as-id is unwanted.
 */
export async function createWorkspaceForUser(
  ownerUid: string,
  name: string,
  opts: { workspaceId?: string } = {}
): Promise<{ workspaceId: string; created: boolean }> {
  const existing = await getWorkspaceForUid(ownerUid);
  if (existing) return { workspaceId: existing.workspaceId, created: false };

  const workspaceId = opts.workspaceId || ownerUid;
  const { FieldValue } = await import('firebase-admin/firestore');
  await db.collection(COLLECTIONS.workspaces).doc(workspaceId).set({
    workspaceId,
    name,
    ownerUid,
    createdAt: FieldValue.serverTimestamp(),
  });
  return { workspaceId, created: true };
}
