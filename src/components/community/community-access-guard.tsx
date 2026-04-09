"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getCommunityByHandle, getUserRoleInCommunity } from '@/lib/community-utils';
import { Loader2 } from 'lucide-react';

interface CommunityAccessGuardProps {
  handle: string;
  children: React.ReactNode;
  allowedRoles?: ('owner' | 'admin' | 'member')[];
  requireAuth?: boolean;
}

/**
 * Guard component that enforces community access control
 * - Checks if community exists
 * - Checks if user is authenticated (if requireAuth is true)
 * - Checks if user has required role in the community
 * - Redirects to appropriate page if access is denied
 */
export function CommunityAccessGuard({
  handle,
  children,
  allowedRoles = ['owner', 'admin', 'member'],
  requireAuth = true,
}: CommunityAccessGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      setChecking(true);

      // Wait for auth to load
      if (authLoading) {
        return;
      }

      // If auth is required but user is not logged in, redirect to login
      if (requireAuth && !user) {
        console.log('🚫 Access denied: User not authenticated');
        router.push('/login');
        return;
      }

      try {
        // Fetch community
        const community = await getCommunityByHandle(handle);
        
        if (!community) {
          console.log('🚫 Access denied: Community not found');
          router.push('/communities');
          return;
        }

        // Check if community is public
        if (community.visibility === 'public') {
          console.log('✅ Access granted: Community is public');
          setHasAccess(true);
          setChecking(false);
          return;
        }

        // For private communities, user must be authenticated
        if (!user) {
          console.log('🚫 Access denied: Private community requires authentication');
          router.push('/login');
          return;
        }

        // Check user's role in the community
        const userRole = await getUserRoleInCommunity(user.uid, community.communityId);
        
        if (userRole === 'guest') {
          console.log('🚫 Access denied: User is not a member of this private community');
          router.push('/communities');
          return;
        }

        // Check if user has one of the allowed roles
        if (!allowedRoles.includes(userRole as any)) {
          console.log(`🚫 Access denied: User role '${userRole}' not in allowed roles:`, allowedRoles);
          router.push(`/${handle}/feed`);
          return;
        }

        console.log(`✅ Access granted: User has role '${userRole}'`);
        setHasAccess(true);
      } catch (error) {
        console.error('Error checking community access:', error);
        router.push('/communities');
      } finally {
        setChecking(false);
      }
    };

    checkAccess();
  }, [handle, user, authLoading, requireAuth, allowedRoles, router]);

  // Show loading state while checking
  if (authLoading || checking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Only render children if access is granted
  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}
