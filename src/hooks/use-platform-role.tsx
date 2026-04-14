'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { useAuth } from './use-auth';
import { PlatformRole, PlatformPermissions, ROLE_PERMISSIONS } from '@/lib/platform-roles';

export interface PlatformRoleState {
  role: PlatformRole | null;
  permissions: PlatformPermissions | null;
  loading: boolean;
}

/**
 * Returns the current user's platform role and permissions.
 *
 * Precedence:
 *  1. Active record in `workspaceMembers` → use that explicit role
 *  2. Owns a community (and NOT in workspaceMembers) → 'owner'
 *  3. Neither → null (should not reach this in practice; auth guards deny access)
 */
export function usePlatformRole(): PlatformRoleState {
  const { user } = useAuth();
  const [state, setState] = useState<PlatformRoleState>({
    role: null,
    permissions: null,
    loading: true,
  });

  useEffect(() => {
    if (!user) {
      setState({ role: null, permissions: null, loading: false });
      return;
    }

    let cancelled = false;

    async function fetchRole() {
      if (!user) return;
      setState(prev => ({ ...prev, loading: true }));

      try {
        // Priority 1: Explicit role in workspaceMembers (invited users)
        const wsQ = query(
          collection(db, 'workspaceMembers'),
          where('userId', '==', user.uid),
          where('status', '==', 'active'),
          limit(1)
        );
        const wsSnap = await getDocs(wsQ);
        if (!wsSnap.empty) {
          const role = wsSnap.docs[0].data().role as PlatformRole;
          if (!cancelled) {
            setState({ role, permissions: ROLE_PERMISSIONS[role], loading: false });
          }
          return;
        }

        // Priority 2: No workspaceMembers record → original workspace owner
        const ownedQ = query(
          collection(db, 'communities'),
          where('ownerId', '==', user.uid),
          limit(1)
        );
        const ownedSnap = await getDocs(ownedQ);
        if (!ownedSnap.empty) {
          if (!cancelled) {
            setState({ role: 'owner', permissions: ROLE_PERMISSIONS['owner'], loading: false });
          }
          return;
        }

        if (!cancelled) {
          setState({ role: null, permissions: null, loading: false });
        }
      } catch (error) {
        console.error('[usePlatformRole] Error fetching role:', error);
        if (!cancelled) {
          setState({ role: null, permissions: null, loading: false });
        }
      }
    }

    fetchRole();
    return () => { cancelled = true; };
  }, [user?.uid]);

  return state;
}
