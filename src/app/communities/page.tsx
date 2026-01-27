'use client';

import { Plus, Loader2 } from 'lucide-react';
import React, { useEffect, useState, Suspense } from 'react';
import { PageLayout } from '@/components/v2/page-layout';
import { PageHeader } from '@/components/v2/page-header';
import { EnhancedListView } from '@/components/v2/enhanced-list-view';
import { CommunityGridItem, CommunityListItem, CommunityCircleItem } from '@/components/v2/community-items';
import { Button } from '@/components/ui/button';
import { CreateCommunityDialog } from '@/components/community/create-community-dialog';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Community } from '@/lib/types';

type CommunityWithId = Community & { id: string; tags?: string[] };

function CommunitiesContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [communities, setCommunities] = useState<CommunityWithId[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { user } = useAuth();
  const [availableTags, setAvailableTags] = useState<{ id: string; name: string }[]>([]);

  const fetchCommunities = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const communitiesRef = collection(db, 'communities');
      const ownedCommunitiesQuery = query(communitiesRef, where('ownerId', '==', user.uid));
      
      const ownedSnapshot = await getDocs(ownedCommunitiesQuery);
      const ownedCommunities = ownedSnapshot.docs.map(doc => ({
        communityId: doc.id,
        id: doc.id,
        ...doc.data(),
      } as CommunityWithId));

      const membersRef = collection(db, 'communityMembers');
      const memberQuery = query(membersRef, where('userId', '==', user.uid));
      
      const memberSnapshot = await getDocs(memberQuery);
      const memberCommunityIds = memberSnapshot.docs.map(doc => doc.data().communityId);
      
      const nonOwnedMemberIds = memberCommunityIds.filter(
        id => !ownedCommunities.find(c => c.communityId === id)
      );
      
      const memberCommunities: CommunityWithId[] = [];
      if (nonOwnedMemberIds.length > 0) {
        const batchSize = 30;
        const batches = [];
        
        for (let i = 0; i < nonOwnedMemberIds.length; i += batchSize) {
          const batch = nonOwnedMemberIds.slice(i, i + batchSize);
          if (batch.length > 0) {
            const communitiesQuery = query(collection(db, 'communities'), where('communityId', 'in', batch));
            batches.push(getDocs(communitiesQuery));
          }
        }
        
        const batchResults = await Promise.all(batches);
        batchResults.forEach(snap => {
          snap.docs.forEach(doc => {
            memberCommunities.push({
              communityId: doc.id,
              id: doc.id,
              ...doc.data(),
            } as CommunityWithId);
          });
        });
      }
      
      const allCommunities = [...ownedCommunities, ...memberCommunities];
      const uniqueCommunities = Array.from(
        new Map(allCommunities.map(item => [item.communityId, item])).values()
      );
      
      setCommunities(uniqueCommunities);

      // Aggregate tags
      const allTags = new Set<string>();
      uniqueCommunities.forEach(community => {
          if (Array.isArray((community as any).tags)) {
              (community as any).tags.forEach((tag: string) => allTags.add(tag));
          }
      });
      const tagObjects = Array.from(allTags).map(tag => ({ id: tag, name: tag }));
      setAvailableTags(tagObjects);

    } catch (error) {
      console.error("Error fetching communities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, [user]);

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-input bg-card p-6 animate-pulse">
          <div className="aspect-[4/3] bg-muted rounded-md mb-4" />
          <div className="h-5 bg-muted rounded w-3/4 mb-2" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      ))}
    </div>
  );

  return (
    <PageLayout>
      <PageHeader
        title="Communities"
        description="Manage your communities or create a new one."
        actions={
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Community
          </Button>
        }
      />
      <EnhancedListView
        items={communities.map(c => {
          const mappedItem = {
            id: c.communityId,
            handle: c.handle,
            name: c.name,
            memberCount: c.memberCount || 0,
            imageUrl: c.communityProfileImage || '/placeholder-community.png',
            imageHint: c.name,
            tags: Array.isArray((c as any).tags) ? (c as any).tags : [],
          };
          return mappedItem;
        })}
        availableTags={availableTags}
        renderGridItem={(item, isSelected, onSelect, urlField) => (
          <CommunityGridItem item={item} isSelected={isSelected} urlField={urlField} />
        )}
        renderListItem={(item, isSelected, onSelect, urlField) => (
          <CommunityListItem item={item} isSelected={isSelected} urlField={urlField} />
        )}
        renderCircleItem={(item, isSelected, onSelect, urlField) => (
          <CommunityCircleItem item={item} isSelected={isSelected} urlField={urlField} />
        )}
        searchKeys={['name', 'tags']}
        selectable={false}
        isLoading={isLoading}
        loadingComponent={<LoadingSkeleton />}
        urlField="handle"
      />
      <CreateCommunityDialog 
        isOpen={isCreateDialogOpen} 
        setIsOpen={setIsCreateDialogOpen}
        onCommunityUpdated={() => {
          // Refresh communities list after creating a new one
          if (user) {
            fetchCommunities();
          }
        }}
      />
    </PageLayout>
  );
}

export default function CommunitiesPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <CommunitiesContent />
    </Suspense>
  );
}
