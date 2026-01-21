
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HeaderBanner } from '@/components/layout/header-banner';
import { CustomListView } from '@/components/shared/custom-list-view';
import { CreateCommunityDialog } from '@/components/community/create-community-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Plus, Users, Loader2 } from 'lucide-react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Community } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CommunityGridItem } from '@/components/community/community-grid-item';
import { CommunityListItem } from '@/components/community/community-list-item';

export default function CommunitiesDashboardPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);

    const communitiesRef = collection(db, 'communities');
    const ownedCommunitiesQuery = query(communitiesRef, where('ownerId', '==', user.uid));

    const unsubscribeOwned = onSnapshot(ownedCommunitiesQuery, async (querySnapshot) => {
      const ownedCommunities = querySnapshot.docs.map(doc => ({
        communityId: doc.id,
        ...doc.data(),
      } as Community));

      const membersRef = collection(db, 'communityMembers');
      const memberQuery = query(membersRef, where('userId', '==', user.uid));
      
      const memberSnapshot = await getDocs(memberQuery);
      const memberCommunityIds = memberSnapshot.docs.map(doc => doc.data().communityId);
      
      const nonOwnedMemberIds = memberCommunityIds.filter(
        id => !ownedCommunities.find(c => c.communityId === id)
      );
      
      const memberCommunities: Community[] = [];
      if (nonOwnedMemberIds.length > 0) {
        const batchSize = 30;
        const batches = [];
        
        for (let i = 0; i < nonOwnedMemberIds.length; i += batchSize) {
          const batch = nonOwnedMemberIds.slice(i, i + batchSize);
          // Firestore `in` query requires a non-empty array.
          if(batch.length > 0) {
            const communitiesQuery = query(collection(db, 'communities'), where('communityId', 'in', batch));
            batches.push(getDocs(communitiesQuery));
          }
        }
        
        const batchResults = await Promise.all(batches);
        batchResults.forEach(snap => {
          snap.docs.forEach(doc => {
            memberCommunities.push({
              communityId: doc.id,
              ...doc.data(),
            } as Community);
          });
        });
      }
      
      const allCommunities = [...ownedCommunities, ...memberCommunities];
      const uniqueCommunities = Array.from(
        new Map(allCommunities.map(item => [item.communityId, item])).values()
      );
      
      setCommunities(uniqueCommunities);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching communities:", error);
      setLoading(false);
    });

    return () => unsubscribeOwned();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <HeaderBanner
        title="Communities"
        description="Manage your communities or create a new one."
      >
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Community
        </Button>
      </HeaderBanner>
      <CustomListView<Community & { id: string }>
        items={communities.map(c => ({ ...c, id: c.communityId }))}
        renderGridItem={(community, isSelected, onSelect) => <CommunityGridItem key={community.id} community={community} />}
        renderListItem={(community, isSelected, onSelect) => <CommunityListItem key={community.id} community={community} />}
        searchKeys={['name', 'tagline']}
        selectable={false}
      />
      <CreateCommunityDialog isOpen={isCreateDialogOpen} setIsOpen={setIsCreateDialogOpen} />
    </div>
  );
}
