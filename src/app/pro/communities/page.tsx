
'use client';

import { useState, useEffect } from 'react';
import { Suspense } from 'react';
import { CommunityList } from '@/components/community/community-list';
import { CreateCommunityDialog } from '@/components/community/create-community-dialog';
import { CustomButton } from '@/components/ui/CustomButton';
import { PlusCircle, Loader2 } from 'lucide-react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Community } from '@/lib/types';

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

    // Query for communities where user is the owner
    const communitiesRef = collection(db, 'communities');
    const ownedCommunitiesQuery = query(communitiesRef, where('ownerId', '==', user.uid));

    const unsubscribeOwned = onSnapshot(ownedCommunitiesQuery, async (querySnapshot) => {
      const ownedCommunities = querySnapshot.docs.map(doc => ({
        communityId: doc.id,
        ...doc.data(),
      } as Community));

      // Query for communities where user is a member
      const membersRef = collection(db, 'communityMembers');
      const memberQuery = query(membersRef, where('userId', '==', user.uid));
      
      const memberSnapshot = await getDocs(memberQuery);
      const memberCommunityIds = memberSnapshot.docs.map(doc => doc.data().communityId);
      
      // Filter out owned communities
      const nonOwnedMemberIds = memberCommunityIds.filter(
        id => !ownedCommunities.find(c => c.communityId === id)
      );
      
      // Fetch community details for member communities (excluding owned ones)
      const memberCommunities: Community[] = [];
      if (nonOwnedMemberIds.length > 0) {
        const batchSize = 30; // Firestore 'in' query limit is 30
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
      
      // Combine and deduplicate communities
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

    // Cleanup subscription on unmount
    return () => unsubscribeOwned();
  }, [user]);

  return (
    <div className="container mx-auto px-0 py-0">
      <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <CommunityList communities={communities} />
        )}
      </Suspense>
      
      <CreateCommunityDialog isOpen={isCreateDialogOpen} setIsOpen={setIsCreateDialogOpen} />
    </div>
  );
}
