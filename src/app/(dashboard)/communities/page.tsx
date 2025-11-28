
'use client';

import { useState, useEffect } from 'react';
import { Suspense } from 'react';
import { CommunityList } from '@/components/community/community-list';
import { CreateCommunityDialog } from '@/components/community/create-community-dialog';
import { CustomButton } from '@/components/ui/CustomButton';
import { PlusCircle, Loader2 } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
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

    const communitiesRef = collection(db, 'communities');
    // Temporarily show ALL communities (remove where clause to see imported communities)
    const q = query(communitiesRef);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userCommunities = querySnapshot.docs.map(doc => ({
        communityId: doc.id,
        ...doc.data(),
      } as Community));
      setCommunities(userCommunities);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching communities:", error);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
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
