'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Community, CommunityMember } from '@/lib/types';
import { Loader2, Mail } from 'lucide-react';
import { PageHeader } from '@/components/v2/page-header';
import { EnhancedListView } from '@/components/v2/enhanced-list-view';
import { MemberGridItem, MemberListItem, MemberCircleItem } from '@/components/members/member-items';
import { Button } from '@/components/ui/button';
import { BroadcastDialog } from '@/components/broadcast/broadcast-dialog';
import { CommunityImage } from '@/components/ui/community-image';

export default function BroadcastPage() {
  const params = useParams();
  const handle = params.handle as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [isBroadcastDialogOpen, setIsBroadcastDialogOpen] = useState(false);

  useEffect(() => {
    const fetchCommunityData = async () => {
      if (!handle) return;
      try {
        setLoading(true);
        const communityQuery = query(collection(db, 'communities'), where('handle', '==', handle));
        const communitySnapshot = await getDocs(communityQuery);

        if (!communitySnapshot.empty) {
          const communityDoc = communitySnapshot.docs[0];
          const communityData = { communityId: communityDoc.id, ...communityDoc.data() } as Community;
          setCommunity(communityData);

          const membersQuery = query(collection(db, 'communityMembers'), where('communityId', '==', communityData.communityId));
          const membersSnapshot = await getDocs(membersQuery);
          const membersData = membersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as CommunityMember);
          setMembers(membersData);
        } else {
          console.error("Community not found");
        }
      } catch (error) {
        console.error("Error fetching community data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityData();
  }, [handle]);

  const selectedMembers = useMemo(() => {
    return members.filter(member => selectedMemberIds.has(member.id));
  }, [members, selectedMemberIds]);

  const handleOpenBroadcastDialog = () => {
    if (selectedMembers.length > 0) {
      setIsBroadcastDialogOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--page-bg-color)' }}>
      <div className="p-8 flex-1 overflow-auto flex flex-col">
        <div className="rounded-2xl flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--page-content-bg)', border: '2px solid var(--page-content-border)' }}>
          {community && (
            <div style={{ backgroundColor: 'var(--page-content-bg)' }}>
              {community.communityBackgroundImage && (
                <CommunityImage
                  src={community.communityBackgroundImage}
                  alt={community.name}
                  fill
                  containerClassName="relative h-32"
                  className="object-cover"
                />
              )}
              <div className="p-6 border-b">
                <div className="flex items-start gap-4">
                  {community.communityProfileImage && (
                    <CommunityImage src={community.communityProfileImage} alt={community.name} width={80} height={80} containerClassName="rounded-full" />
                  )}
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold">{community.name}</h1>
                    <p className="text-sm text-muted-foreground mt-1">{community.tagline}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <PageHeader
            title="Broadcast"
            description={`Select members to send a broadcast message`}
            actions={
              <Button 
                onClick={handleOpenBroadcastDialog}
                disabled={selectedMembers.length === 0}
              >
                <Mail className="mr-2 h-4 w-4" />
                Message {selectedMembers.length} {selectedMembers.length === 1 ? 'Member' : 'Members'}
              </Button>
            }
          />
          <div className="flex-1 overflow-y-auto">
            <EnhancedListView
              items={members.map(m => ({
                id: m.id,
                name: m.displayName || 'N/A',
                imageUrl: m.photoURL,
                tags: m.tags || [],
                ...m,
              }))}
              renderGridItem={(item, isSelected) => (
                <MemberGridItem item={item} isSelected={isSelected} />
              )}
              renderListItem={(item, isSelected) => (
                <MemberListItem item={item} isSelected={isSelected} />
              )}
              renderCircleItem={(item, isSelected) => (
                  <MemberCircleItem item={item} isSelected={isSelected} />
              )}
              searchKeys={['name', 'email']}
              selectable={true}
              selection={selectedMemberIds}
              onSelectionChange={setSelectedMemberIds}
              isLoading={loading}
            />
          </div>
          {community && (
              <BroadcastDialog
                isOpen={isBroadcastDialogOpen}
                onClose={() => setIsBroadcastDialogOpen(false)}
                communityId={community.communityId}
                selectedMembers={selectedMembers}
                communityName={community.name}
              />
          )}
        </div>
      </div>
    </div>
  );
}
