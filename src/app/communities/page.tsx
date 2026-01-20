
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Community } from '@/lib/types';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { CommunityList } from '@/components/community/community-list';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreateCommunityDialog } from '@/components/community/create-community-dialog';

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

    const ownedQuery = query(collection(db, 'communities'), where('ownerId', '==', user.uid));
    
    const unsubscribe = onSnapshot(ownedQuery, async (ownedSnapshot) => {
      const ownedCommunities = ownedSnapshot.docs.map(doc => ({
        communityId: doc.id,
        ...doc.data(),
      } as Community));

      const memberQuery = query(collection(db, 'communityMembers'), where('userId', '==', user.uid));
      const memberSnapshot = await getDocs(memberQuery);
      const memberCommunityIds = memberSnapshot.docs.map(doc => doc.data().communityId);
      
      const nonOwnedMemberIds = memberCommunityIds.filter(
        id => !ownedCommunities.find(c => c.communityId === id)
      );
      
      let memberCommunities: Community[] = [];
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

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Your Communities</h1>
            <p className="text-muted-foreground mt-1">You are a member of {communities.length} communities.</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Community
          </Button>
        </div>
        <CommunityList communities={communities} loading={loading} />
      </div>
      <CreateCommunityDialog isOpen={isCreateDialogOpen} setIsOpen={setIsCreateDialogOpen} />
    </div>
  );
}
