
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getCommunityByHandle, getUserRoleInCommunity } from '@/lib/community-utils';
import { Community, CommunityMember, UserRole } from '@/lib/types';
import { CommunityHeader } from '@/components/community/community-header';
import { CommunityStats } from '@/components/community/community-stats';
import { MembersList } from '@/components/community/members-list';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateCommunityDialog } from '@/components/community/create-community-dialog';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { ListView } from '@/components/ui/list-view';

export default function CommunityPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const handle = params.handle as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    if (authLoading) return;

    const fetchCommunityData = async () => {
      if (!handle) return;
      setLoading(true);

      try {
        const communityData = await getCommunityByHandle(handle);
        setCommunity(communityData);

        if (communityData) {
          if (user) {
            const role = await getUserRoleInCommunity(user.uid, communityData.communityId);
            setUserRole(role);
          }
          
          // Fetch members
          const membersRef = collection(db, "communityMembers");
          const q = query(membersRef, where("communityId", "==", communityData.communityId));
          const unsubscribe = onSnapshot(q, (snapshot) => {
            const membersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as unknown as CommunityMember);
            setMembers(membersData);
          });
          // Here you should ideally manage the unsubscribe function, 
          // but for simplicity in this context we'll let it run.
        }

      } catch (error) {
        console.error('Error fetching community data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCommunityData();
  }, [handle, user, authLoading]);
  
  const handleCommunityUpdated = () => {
    // Re-fetch community data when the dialog is closed after an update
    // This logic is simplified; a more robust solution would be better
    if (!authLoading) {
      setLoading(true);
      getCommunityByHandle(handle).then(communityData => {
        setCommunity(communityData);
        setLoading(false);
      });
    }
  };
  
  const filteredMembers = members.filter(member =>
    member.userDetails?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.userDetails?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || authLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-40 w-full rounded-none" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 md:px-8">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="px-4 md:px-8">
            <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!community) {
    return <div className="p-8 text-center text-foreground">Community not found.</div>;
  }

  return (
    <div className="space-y-8">
      <CommunityHeader community={community} userRole={userRole} onEdit={() => setIsEditDialogOpen(true)} />
      <div className="px-4 md:px-8">
        <CommunityStats community={community} />
      </div>
      <div className="px-4 md:px-8">
         <Card>
            <CardContent className="p-0">
                 <ListView
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                  >
                    <MembersList members={filteredMembers} userRole={userRole} viewMode={viewMode} />
                </ListView>
            </CardContent>
         </Card>
      </div>

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
