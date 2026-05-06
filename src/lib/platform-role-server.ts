import { db as adminDb } from '@/firebase/admin';
import { PlatformRole } from './platform-roles';

/**
 * Server-side function to get a user's platform role using Admin SDK.
 * Bypasses Firestore security rules.
 */
export async function getPlatformRoleForUid(uid: string): Promise<PlatformRole | null> {
  try {
    // Check workspaceMembers first (explicit platform role)
    const wsSnap = await adminDb
      .collection('workspaceMembers')
      .where('userId', '==', uid)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (!wsSnap.empty) {
      const wsData = wsSnap.docs[0].data();
      return wsData.role as PlatformRole;
    }

    // If no workspace member, check if they own any communities (community_creator)
    const communitiesSnap = await adminDb
      .collection('communities')
      .where('ownerId', '==', uid)
      .limit(1)
      .get();

    if (!communitiesSnap.empty) {
      return 'community_creator';
    }

    // No platform role
    return null;
  } catch (error) {
    console.error('[getPlatformRoleForUid] error:', error);
    return null;
  }
}

/**
 * Returns true if the user has workspace-admin privileges
 * (platform role 'owner' or 'admin'). Used to gate platform-wide
 * mutations like waitlist approvals and team management.
 */
export async function isWorkspaceAdmin(uid: string): Promise<boolean> {
  const role = await getPlatformRoleForUid(uid);
  return role === 'owner' || role === 'admin';
}
