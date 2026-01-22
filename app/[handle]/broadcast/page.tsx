'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Community } from '@/lib/types';
import { Loader2, Send } from 'lucide-react';
import { PageLayout } from '@/components/v2/page-layout';
import { PageHeader } from '@/components/v2/page-header';
import { EnhancedListView } from '@/components/v2/enhanced-list-view';
import { MemberGridItem, MemberListItem, MemberCircleItem } from '@/components/v2/member-items';
import { Button } from '@/components/ui/button';

interface MemberData {
  id: string;
  name: string;
  email?: string;
  imageUrl: string;
  role?: string;
  userId: string;
  joinedDate?: any;
}

function BroadcastContent() {
  const params = useParams();
  const handle = params.handle as string;
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCommunityAndMembers = async () => {
      try {
        setIsLoading(true);

        // Fetch community by handle
        const communityQuery = query(collection(db, 'communities'), where('handle', '==', handle));
        const communitySnapshot = await getDocs(communityQuery);
        
        if (communitySnapshot.empty) {
          setIsLoading(false);
          return;
        }

        const communityData = {
          communityId: communitySnapshot.docs[0].id,
          ...communitySnapshot.docs[0].data()
        } as Community;
        setCommunity(communityData);

        // Fetch community members
        const membersQuery = query(
          collection(db, 'communityMembers'),
          where('communityId', '==', communityData.communityId)
        );
        const membersSnapshot = await getDocs(membersQuery);

        // Fetch user details for each member
        const memberPromises = membersSnapshot.docs.map(async (memberDoc) => {
          const memberData = memberDoc.data();
          const userId = memberData.userId;

          // Fetch user profile
          const userQuery = query(collection(db, 'users'), where('userId', '==', userId));
          const userSnapshot = await getDocs(userQuery);

          if (!userSnapshot.empty) {
            const userData = userSnapshot.docs[0].data();
            return {
              id: memberDoc.id,
              userId: userId,
              name: userData.displayName || userData.email || 'Unknown User',
              email: userData.email,
              imageUrl: userData.photoURL || '/placeholder-avatar.png',
              role: memberData.role || 'Member',
              joinedDate: memberData.joinedAt,
            };
          }

          return {
            id: memberDoc.id,
            userId: userId,
            name: 'Unknown User',
            email: '',
            imageUrl: '/placeholder-avatar.png',
            role: memberData.role || 'Member',
            joinedDate: memberData.joinedAt,
          };
        });

        const membersData = await Promise.all(memberPromises);
        
        console.log('=== BROADCAST MEMBERS DATA ===');
        console.log('Total members:', membersData.length);
        console.log('===================');
        
        setMembers(membersData);
      } catch (error) {
        console.error('Error fetching community and members:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommunityAndMembers();
  }, [handle]);

  const handleSendBroadcast = () => {
    console.log('Sending broadcast to:', selectedMembers);
    // TODO: Implement broadcast functionality
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-input bg-card p-6 animate-pulse">
          <div className="aspect-square bg-muted rounded-full mb-4 mx-auto w-20 h-20" />
          <div className="h-5 bg-muted rounded w-3/4 mb-2 mx-auto" />
          <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
        </div>
      ))}
    </div>
  );

  if (!community && !isLoading) {
    return (
      <PageLayout>
        <div className="p-8">Community not found</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title={community ? `${community.name} - Broadcast` : 'Broadcast'}
        description={`Select members to send a broadcast message (${selectedMembers.length} selected)`}
        actions={
          <Button 
            variant="selected" 
            onClick={handleSendBroadcast}
            disabled={selectedMembers.length === 0}
          >
            <Send className="mr-2 h-4 w-4" />
            Send to {selectedMembers.length} {selectedMembers.length === 1 ? 'Member' : 'Members'}
          </Button>
        }
      />
      <EnhancedListView
        items={members}
        renderGridItem={(item, isSelected, onSelect) => (
          <div onClick={onSelect}>
            <MemberGridItem item={item} isSelected={isSelected} />
          </div>
        )}
        renderListItem={(item, isSelected, onSelect) => (
          <div onClick={onSelect}>
            <MemberListItem item={item} isSelected={isSelected} />
          </div>
        )}
        renderCircleItem={(item, isSelected, onSelect) => (
          <div onClick={onSelect}>
            <MemberCircleItem item={item} isSelected={isSelected} />
          </div>
        )}
        searchKeys={['name', 'email']}
        selectable={true}
        onSelectionChange={setSelectedMembers}
        isLoading={isLoading}
        loadingComponent={<LoadingSkeleton />}
      />
    </PageLayout>
  );
}

export default function BroadcastPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <BroadcastContent />
    </Suspense>
  );
}
