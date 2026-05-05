import { db } from '@/firebase/admin';
import type { PlatformRole } from '@/lib/platform-roles';

/**
 * Resolve a user's platform role on the server (via Firebase Admin SDK).
 * Mirrors the client-side `usePlatformRole` precedence:
 *   1. Active record in `workspaceMembers` → its role
 *   2. Owns at least one community → 'owner'
 *   3. Otherwise null
 */
export async function getPlatformRoleForUid(uid: string): Promise<PlatformRole | null> {
  // Priority 1: workspaceMembers
  const wsSnap = await db
    .collection('workspaceMembers')
    .where('userId', '==', uid)
    .where('status', '==', 'active')
    .limit(1)
    .get();
  if (!wsSnap.empty) {
    return (wsSnap.docs[0].data().role as PlatformRole) ?? null;
  }

  // Priority 2: community ownership
  const ownedSnap = await db
    .collection('communities')
    .where('ownerId', '==', uid)
    .limit(1)
    .get();
  if (!ownedSnap.empty) return 'owner';

  return null;
}

/** Returns true if the user is workspace owner or admin. */
export async function isWorkspaceAdmin(uid: string): Promise<boolean> {
  const role = await getPlatformRoleForUid(uid);
  return role === 'owner' || role === 'admin';
}
