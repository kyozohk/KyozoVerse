'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, Suspense, useCallback } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Community } from '@/lib/types';
import { Loader2, Mail, Lock, Globe } from 'lucide-react';
import { Banner } from '@/components/ui/banner';
import { EnhancedListView } from '@/components/v2/enhanced-list-view';
import { MemberGridItem, MemberListItem, MemberCircleItem } from '@/components/v2/member-items';
import { EnhancedBroadcastDialog } from '@/components/broadcast/enhanced-broadcast-dialog';

interface MemberData {
  id: string;
  name: string;
  email?: string;
  imageUrl: string;
  role?: string;
  userId: string;
  joinedDate?: any;
  tags?: string[];
}

function BroadcastContent() {
  const params = useParams();
  const handle = params.handle as string;
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<MemberData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBroadcastDialogOpen, setIsBroadcastDialogOpen] = useState(false);
  const [selection, setSelection] = useState<Set<string>>(new Set());

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

        // Fetch community members - use userDetails embedded in the member doc (same as members page)
        const membersQuery = query(
          collection(db, 'communityMembers'),
          where('communityId', '==', communityData.communityId)
        );
        const membersSnapshot = await getDocs(membersQuery);

        // Transform member docs using userDetails from the member document
        const membersData = membersSnapshot.docs.map((memberDoc) => {
          const memberData = memberDoc.data();
          const userDetails = memberData.userDetails || {};
          
          return {
            id: memberDoc.id,
            userId: memberData.userId,
            name: userDetails.displayName || userDetails.email || 'Unknown User',
            email: userDetails.email || '',
            imageUrl: userDetails.avatarUrl || userDetails.photoURL || '/placeholder-avatar.png',
            role: memberData.role || 'member',
            joinedDate: memberData.joinedAt,
            tags: memberData.tags || [],
          };
        });
        
        setMembers(membersData);
      } catch (error) {
        console.error('Error fetching community and members:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommunityAndMembers();
  }, [handle]);
  
  useEffect(() => {
    const newSelectedMembers = members.filter(m => selection.has(m.id));
    setSelectedMembers(newSelectedMembers);
  }, [selection, members]);

  const handleOpenBroadcastDialog = () => {
    if (selectedMembers.length === 0) return;
    setIsBroadcastDialogOpen(true);
  };
  
  const onSelectionChange = useCallback((ids: Set<string>, items: MemberData[]) => {
    setSelection(ids);
    setSelectedMembers(items);
  }, []);

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
      <div className="p-8">Community not found</div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--page-bg-color)' }}>
      <div className="p-8 flex-1 overflow-auto">
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--page-content-bg)', border: '2px solid var(--page-content-border)' }}>
          {community && (
            <Banner
              backgroundImage={community.communityBackgroundImage}
              iconImage={community.communityProfileImage}
              title={community.name}
              location={(community as any).location}
              locationExtra={
                <span className="flex items-center gap-1 text-sm text-white/90">
                  {(community as any).visibility === 'private' ? (
                    <><Lock className="h-3.5 w-3.5" /> Private</>
                  ) : (
                    <><Globe className="h-3.5 w-3.5" /> Public</>
                  )}
                </span>
              }
              subtitle={community.tagline || (community as any).mantras}
              tags={(community as any).tags || []}
              ctas={selectedMembers.length >= 1 ? [{
                label: `Message ${selectedMembers.length} ${selectedMembers.length === 1 ? 'Member' : 'Members'}`,
                icon: <Mail className="h-4 w-4" />,
                onClick: handleOpenBroadcastDialog,
              }] : []}
              height="16rem"
            />
          )}
          <div className="p-6">
            <EnhancedListView
              items={members}
              renderGridItem={(item, isSelected, onSelect, urlField, selectable) => (
                <MemberGridItem item={item} isSelected={isSelected} selectable={selectable} />
              )}
              renderListItem={(item, isSelected, onSelect, urlField, selectable) => (
                <MemberListItem item={item} isSelected={isSelected} selectable={selectable} />
              )}
              renderCircleItem={(item, isSelected, onSelect, urlField, selectable) => (
                <MemberCircleItem item={item} isSelected={isSelected} selectable={selectable} />
              )}
              searchKeys={['name', 'email', 'tags']}
              selectable={true}
              onSelectionChange={onSelectionChange}
              isLoading={isLoading}
              loadingComponent={<LoadingSkeleton />}
            />
          </div>
        </div>
      </div>
      {/* Enhanced Broadcast Dialog */}
      {community && (
        <EnhancedBroadcastDialog
          isOpen={isBroadcastDialogOpen}
          onClose={() => setIsBroadcastDialogOpen(false)}
          members={members}
          initialSelectedMembers={selectedMembers}
          communityName={community.name}
          communityHandle={community.handle}
        />
      )}
    </div>
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
