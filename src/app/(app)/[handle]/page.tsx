

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
import { CreateCommunityDialog } from '@/components/community/create-community-dialog';

export default function CommunityPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const handle = params.handle as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchCommunityData = async () => {
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
  };

  useEffect(() => {
    if (!authLoading) {
      fetchCommunityData();
    }
  }, [handle, user, authLoading]);
  
  const handleCommunityUpdated = () => {
    // Re-fetch community data when the dialog is closed after an update
    fetchCommunityData();
  };

  if (loading || authLoading) {
    return (
      <div className="p-4 md:p-8 space-y-8">
        <Skeleton className="h-40 w-full rounded-xl bg-gray-700/50" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Skeleton className="h-24 w-full bg-gray-700/50" />
          <Skeleton className="h-24 w-full bg-gray-700/50" />
          <Skeleton className="h-24 w-full bg-gray-700/50" />
          <Skeleton className="h-24 w-full bg-gray-700/50" />
        </div>
        <Skeleton className="h-96 w-full bg-gray-700/50" />
      </div>
    );
  }

  if (!community) {
    return <div className="p-8 text-center text-white">Community not found.</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      <CommunityHeader community={community} userRole={userRole} onEdit={() => setIsEditDialogOpen(true)} />
      <CommunityStats community={community} />
      <MembersList community={community} userRole={userRole} />

      {isEditDialogOpen && (
        <CreateCommunityDialog
          isOpen={isEditDialogOpen}
          setIsOpen={setIsEditDialogOpen}
          existingCommunity={community}
          onCommunityUpdated={handleCommunityUpdated}
        />
      )}
    </div>
  );
}
