'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getCommunityByHandle, getUserRoleInCommunity } from '@/lib/community-utils';
import { Community, UserRole } from '@/lib/types';
import { CommunityHeader } from '@/components/community/community-header';
import { CommunityStats } from '@/components/community/community-stats';
import { MembersList } from '@/components/community/members-list';
import { Skeleton } from '@/components/ui/skeleton';

export default function CommunityPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const handle = params.handle as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!handle) return;
      setLoading(true);

      try {
        const communityData = await getCommunityByHandle(handle);
        setCommunity(communityData);

        if (communityData && user) {
          const role = await getUserRoleInCommunity(user.uid, communityData.communityId);
          setUserRole(role);
        }
      } catch (error) {
        console.error('Error fetching community data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchData();
    }
  }, [handle, user, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="p-8 space-y-8">
        <Skeleton className="h-60 w-full rounded-xl" />
        <div className="grid grid-cols-4 gap-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!community) {
    return <div className="p-8 text-center">Community not found.</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      <CommunityHeader community={community} userRole={userRole} />
      <CommunityStats community={community} />
      <MembersList community={community} userRole={userRole} />
    </div>
  );
}
