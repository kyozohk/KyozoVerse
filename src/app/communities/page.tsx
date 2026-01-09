
'use client';

import { useState, useEffect } from 'react';
import { Suspense } from 'react';
import { CommunityList } from '@/components/community/community-list';
import { CreateCommunityDialog } from '@/components/community/create-community-dialog';
import { Loader2 } from 'lucide-react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Community } from '@/lib/types';
import { CommunityBanner } from '@/components/community/community-banner';
import { CommunitiesDashboardStats } from '@/components/community/communities-dashboard-stats';

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
    <div className="container mx-auto px-0 py-0">
      <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="p-8">
            <CommunityBanner 
              totalCommunities={communities.length} 
              onCreateClick={() => setIsCreateDialogOpen(true)} 
            />
            <CommunitiesDashboardStats communities={communities} />
            <CommunityList communities={communities} />
          </div>
        )}
      </Suspense>
      
      <CreateCommunityDialog isOpen={isCreateDialogOpen} setIsOpen={setIsCreateDialogOpen} />
    </div>
  );
}
