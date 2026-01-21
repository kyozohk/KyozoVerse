
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

const CommunityGridItem = (item: Community, isSelected: boolean, onSelect: () => void) => (
  <Card key={item.communityId} className={cn("overflow-hidden transition-all hover:shadow-md flex flex-col", isSelected && "ring-2 ring-ring")}>
    <Link href={`/${item.handle}`} className="block flex flex-col h-full">
      <CardHeader className="p-0">
        <div className="aspect-[4/3] relative bg-muted">
          {item.communityProfileImage ? (
            <Image
              src={item.communityProfileImage}
              alt={item.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Users className="h-12 w-12" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <h3 className="font-semibold text-lg truncate">{item.name}</h3>
        {item.tagline && (
          <p className="text-sm text-muted-foreground truncate mt-1">{item.tagline}</p>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="h-4 w-4 mr-2" />
          <span>{item.memberCount.toLocaleString()} members</span>
        </div>
      </CardFooter>
    </Link>
  </Card>
);

const CommunityListItem = (item: Community, isSelected: boolean, onSelect: () => void) => (
  <Link key={item.communityId} href={`/${item.handle}`} className="block">
    <Card className={cn("flex items-center p-4 transition-all hover:bg-secondary/50 rounded-xl border", isSelected && "ring-2 ring-ring bg-secondary")}>
      <div className="w-16 h-16 relative rounded-md overflow-hidden bg-muted flex-shrink-0">
        {item.communityProfileImage ? (
          <Image
            src={item.communityProfileImage}
            alt={item.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Users className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="ml-4 flex-grow min-w-0">
        <h3 className="font-semibold text-lg truncate">{item.name}</h3>
        {item.tagline && (
          <p className="text-sm text-muted-foreground truncate">{item.tagline}</p>
        )}
        <div className="flex items-center text-sm text-muted-foreground mt-1">
          <Users className="h-4 w-4 mr-2" />
          <span>{item.memberCount.toLocaleString()} members</span>
        </div>
      </div>
    </Card>
  </Link>
);

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
          const communitiesQuery = query(collection(db, 'communities'), where('communityId', 'in', batch));
          batches.push(getDocs(communitiesQuery));
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
        renderGridItem={CommunityGridItem}
        renderListItem={CommunityListItem}
        searchKeys={['name', 'tagline']}
        selectable={false}
      />
      <CreateCommunityDialog isOpen={isCreateDialogOpen} setIsOpen={setIsCreateDialogOpen} />
    </div>
  );
}
