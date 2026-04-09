import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getCommunityByHandle, getUserRoleInCommunity } from '@/lib/community-utils';
import { Community, UserRole } from '@/lib/types';

interface UseCommunityAccessOptions {
  handle: string;
  requireAuth?: boolean;
  allowedRoles?: UserRole[];
  redirectOnDenied?: boolean;
}

interface UseCommunityAccessReturn {
  community: Community | null;
  userRole: UserRole;
  loading: boolean;
  hasAccess: boolean;
}

/**
 * Hook to check and enforce community access control
 * Returns community data, user role, and access status
 */
export function useCommunityAccess({
  handle,
  requireAuth = true,
  allowedRoles = ['owner', 'admin', 'member'],
  redirectOnDenied = true,
}: UseCommunityAccessOptions): UseCommunityAccessReturn {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [community, setCommunity] = useState<Community | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      setLoading(true);

      // Wait for auth to load
      if (authLoading) {
        return;
      }

      // If auth is required but user is not logged in
      if (requireAuth && !user) {
        console.log('🚫 Access denied: User not authenticated');
        if (redirectOnDenied) {
          router.push('/login');
        }
        setLoading(false);
        return;
      }

      try {
        // Fetch community
        const communityData = await getCommunityByHandle(handle);
        
        if (!communityData) {
          console.log('🚫 Access denied: Community not found');
          if (redirectOnDenied) {
            router.push('/communities');
          }
          setLoading(false);
          return;
        }

        setCommunity(communityData);

        // Check if community is public
        if (communityData.visibility === 'public') {
          console.log('✅ Access granted: Community is public');
          setHasAccess(true);
          
          // Still get user role if user is logged in
          if (user) {
            const role = await getUserRoleInCommunity(user.uid, communityData.communityId);
            setUserRole(role);
          }
          
          setLoading(false);
          return;
        }

        // For private communities, user must be authenticated
        if (!user) {
          console.log('🚫 Access denied: Private community requires authentication');
          if (redirectOnDenied) {
            router.push('/login');
          }
          setLoading(false);
          return;
        }

        // Check user's role in the community
        const role = await getUserRoleInCommunity(user.uid, communityData.communityId);
        setUserRole(role);
        
        if (role === 'guest') {
          console.log('🚫 Access denied: User is not a member of this private community');
          if (redirectOnDenied) {
            router.push('/communities');
          }
          setLoading(false);
          return;
        }

        // Check if user has one of the allowed roles
        if (!allowedRoles.includes(role)) {
          console.log(`🚫 Access denied: User role '${role}' not in allowed roles:`, allowedRoles);
          if (redirectOnDenied) {
            router.push(`/${handle}/feed`);
          }
          setLoading(false);
          return;
        }

        console.log(`✅ Access granted: User has role '${role}'`);
        setHasAccess(true);
      } catch (error) {
        console.error('Error checking community access:', error);
        if (redirectOnDenied) {
          router.push('/communities');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle, user?.uid, authLoading, requireAuth, redirectOnDenied]);

  return {
    community,
    userRole,
    loading,
    hasAccess,
  };
}
