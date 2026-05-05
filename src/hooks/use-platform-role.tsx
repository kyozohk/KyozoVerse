'use client';

import { useState, useEffect } from 'react';
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
 * Resolution happens server-side via `/api/me/role` (which uses the Admin
 * SDK to bypass tightened workspaceMembers read rules). The server applies
 * the same precedence the client used to:
 *   1. Active row in `workspaceMembers` → that explicit role
 *   2. Owns at least one community → 'owner'
 *   3. Otherwise → null
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
        const token = await user.getIdToken();
        const res = await fetch('/api/me/role', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error(`Role lookup failed: ${res.status}`);
        }
        const { role } = (await res.json()) as { role: PlatformRole | null };
        if (cancelled) return;
        setState({
          role,
          permissions: role ? ROLE_PERMISSIONS[role] : null,
          loading: false,
        });
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
