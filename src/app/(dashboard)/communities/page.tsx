
'use client';

import { useState, useEffect } from 'react';
import { Suspense } from 'react';
import { CommunityList } from '@/components/community/community-list';
import { CreateCommunityDialog } from '@/components/community/create-community-dialog';
import { CustomButton } from '@/components/ui/CustomButton';
import { PlusCircle, Loader2 } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Community } from '@/lib/types';

export default function CommunitiesDashboardPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchCommunities() {
      if (!user) return;
      
      setLoading(true);
      try {
        // Fetch communities where user is owner or member
        const ownedCommunitiesQuery = query(
          collection(db, 'communities'),
          where('ownerId', '==', user.uid)
        );
        
        const ownedCommunitiesSnapshot = await getDocs(ownedCommunitiesQuery);
        const ownedCommunities = ownedCommunitiesSnapshot.docs.map(doc => ({
          communityId: doc.id,
          ...doc.data()
        } as Community));
        
        // Fetch communities where user is a member
        const memberCommunitiesQuery = query(
          collection(db, 'communityMembers'),
          where('userId', '==', user.uid)
        );
        
        const memberCommunitiesSnapshot = await getDocs(memberCommunitiesQuery);
        const memberCommunityIds = memberCommunitiesSnapshot.docs.map(doc => doc.data().communityId);
        
        // If user is member of any communities, fetch their details
        let memberCommunities: Community[] = [];
        if (memberCommunityIds.length > 0) {
          // We need to fetch each community separately as Firestore doesn't support array contains with multiple values
          const memberCommunitiesPromises = memberCommunityIds.map(async (id) => {
            const communityDoc = await getDocs(
              query(collection(db, 'communities'), where('communityId', '==', id))
            );
            return communityDoc.docs.map(doc => ({
              communityId: doc.id,
              ...doc.data()
            } as Community));
          });
          
          const memberCommunitiesResults = await Promise.all(memberCommunitiesPromises);
          memberCommunities = memberCommunitiesResults.flat();
        }
        
        // Combine and deduplicate communities
        const allCommunities = [...ownedCommunities, ...memberCommunities];
        const uniqueCommunities = Array.from(
          new Map(allCommunities.map(item => [item.communityId, item])).values()
        );
        
        setCommunities(uniqueCommunities);
      } catch (error) {
        console.error("Error fetching communities:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCommunities();
  }, [user]);

  return (
    <div className="container mx-auto py-2 px-2">
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
