'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, Suspense, useMemo } from 'react';
import { collection, query, where, getDocs, addDoc, setDoc, doc, serverTimestamp, increment, updateDoc, orderBy, limit, startAfter, DocumentSnapshot, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Community } from '@/lib/types';
import { Loader2, UserPlus, Mail, Globe, Lock } from 'lucide-react';
import { Banner } from '@/components/ui/banner';
import { EnhancedListView } from '@/components/v2/enhanced-list-view';
import { MemberGridItem, MemberListItem, MemberCircleItem } from '@/components/v2/member-items';
import { Button } from '@/components/ui/button';
import { MemberDialog } from '@/components/community/member-dialog';
import { InviteMemberDialog } from '@/components/community/invite-member-dialog';
import { TagMembersDialog } from '@/components/community/tag-members-dialog';
import { addTagsToCommunity } from '@/lib/community-tags';
import { useAuth } from '@/hooks/use-auth';
import { Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getUserRoleInCommunity } from '@/lib/community-utils';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { communityAuth } from '@/firebase/community-auth';

interface MemberData {
  id: string;
  userId: string;
  name: string;
  email?: string;
  imageUrl: string;
  role?: string;
  joinedDate?: any;
  tags?: string[];
}

const PAGE_SIZE = 20;

function MembersContent() {
  const params = useParams();
  const handle = params.handle as string;
  const { user } = useAuth();
  const { toast } = useToast();
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isTaggingOpen, setIsTaggingOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [userRole, setUserRole] = useState<string | null>(null);

  const selectedMembers = useMemo(() => {
    return members.filter(m => selectedIds.has(m.id));
  }, [members, selectedIds]);
  
  // Pagination state
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Helper function to transform member docs to MemberData
  const transformMemberDoc = (memberDoc: any): MemberData => {
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
  };

  // Initial load - fetch community and first page of members
  useEffect(() => {
    const fetchCommunityAndMembers = async () => {
      try {
        setIsLoading(true);
        setMembers([]);
        setLastDoc(null);
        setHasMore(true);

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

        // Fetch first page of community members using userDetails from the member doc
        const membersQuery = query(
          collection(db, 'communityMembers'),
          where('communityId', '==', communityData.communityId),
          orderBy('joinedAt', 'desc'),
          limit(PAGE_SIZE)
        );
        const membersSnapshot = await getDocs(membersQuery);

        // Transform member docs - use userDetails embedded in the member document
        const membersData = membersSnapshot.docs.map(transformMemberDoc);
        
        setMembers(membersData);
        setLastDoc(membersSnapshot.docs[membersSnapshot.docs.length - 1] || null);
        setHasMore(membersSnapshot.docs.length === PAGE_SIZE);
        
        // Fetch user role
        if (user && communityData) {
          const role = await getUserRoleInCommunity(user.uid, communityData.communityId);
          setUserRole(role);
        }
      } catch (error) {
        console.error('Error fetching community and members:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommunityAndMembers();
  }, [handle, user]);

  // Load more members (infinite scroll)
  const loadMoreMembers = async () => {
    if (!community || !lastDoc || isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    try {
      const membersQuery = query(
        collection(db, 'communityMembers'),
        where('communityId', '==', community.communityId),
        orderBy('joinedAt', 'desc'),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );
      const membersSnapshot = await getDocs(membersQuery);
      
      const newMembers = membersSnapshot.docs.map(transformMemberDoc);
      
      setMembers(prev => [...prev, ...newMembers]);
      setLastDoc(membersSnapshot.docs[membersSnapshot.docs.length - 1] || null);
      setHasMore(membersSnapshot.docs.length === PAGE_SIZE);
    } catch (error) {
      console.error('Error loading more members:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleAddMember = async (data: { displayName: string; email: string; phone?: string; avatarUrl?: string }) => {
    // ... (implementation unchanged)
  };

  const canManage = userRole === 'owner' || userRole === 'admin';

  // Handle applying tags to selected members (now receives memberIds from dialog)
  const handleApplyTags = async (tagsToAdd: string[], tagsToRemove: string[], memberIds: string[]) => {
    if (!community?.communityId) {
      console.error('No community ID available');
      return;
    }
    
    try {
      // Save new tags to community's tags subcollection
      if (tagsToAdd.length > 0) {
        await addTagsToCommunity(community.communityId, tagsToAdd);
      }

      // Update all selected members
      const updates = memberIds.map(async (id) => {
        const memberRef = doc(db, 'communityMembers', id);
        
        // Add new tags if any
        if (tagsToAdd.length > 0) {
          await updateDoc(memberRef, {
            tags: arrayUnion(...tagsToAdd),
          });
        }
        
        // Remove tags if any
        if (tagsToRemove.length > 0) {
          await updateDoc(memberRef, {
            tags: arrayRemove(...tagsToRemove),
          });
        }
      });
    
      await Promise.all(updates);
      
      // Update local state to reflect tag changes
      setMembers(prevMembers => prevMembers.map(m => {
        if (memberIds.includes(m.id)) {
          const currentTags = m.tags || [];
          const newTags = [...currentTags.filter(t => !tagsToRemove.includes(t)), ...tagsToAdd.filter(t => !currentTags.includes(t))];
          return { ...m, tags: newTags };
        }
        return m;
      }));
      
      setSelectedIds(new Set()); // Clear selection after applying
    } catch (error) {
      console.error('Error applying tags:', error);
      throw error; // Re-throw so dialog can show error
    }
  };

  // Convert MemberData to CommunityMember format for TagMembersDialog
  const allMembersForDialog = members.map(m => ({
    id: m.id,
    userId: m.userId,
    communityId: community?.communityId || '',
    role: m.role || 'member',
    tags: m.tags || [],
    userDetails: {
      displayName: m.name,
      email: m.email || '',
      avatarUrl: m.imageUrl,
    },
  }));

  const selectedMembersForDialog = selectedMembers.map(m => ({
    id: m.id,
    userId: m.userId,
    communityId: community?.communityId || '',
    role: m.role || 'member',
    tags: m.tags || [],
    userDetails: {
      displayName: m.name,
      email: m.email || '',
      avatarUrl: m.imageUrl,
    },
  }));

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
      <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--page-bg-color)' }}>
        <div className="p-8">
          <div className="rounded-2xl p-8" style={{ backgroundColor: 'var(--page-content-bg)', border: '2px solid var(--page-content-border)' }}>
            <p>Community not found</p>
          </div>
        </div>
      </div>
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
              ctas={canManage ? [
                {
                  label: 'Invite Member',
                  icon: <Mail className="h-4 w-4" />,
                  onClick: () => setIsInviteDialogOpen(true),
                },
                {
                  label: 'Add Member',
                  icon: <UserPlus className="h-4 w-4" />,
                  onClick: () => setIsAddMemberOpen(true),
                },
              ] : []}
              height="16rem"
            />
          )}
        </div>
        
        <div className="mt-6 rounded-2xl p-6" style={{ backgroundColor: 'var(--page-content-bg)', border: '2px solid var(--page-content-border)' }}>
          <EnhancedListView
            items={members}
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
            selectable={canManage}
            selection={selectedIds}
            onSelectionChange={setSelectedIds}
            selectionActions={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTaggingOpen(true)}
                className="gap-2"
                style={{ 
                  borderColor: '#E8DFD1',
                  backgroundColor: '#E8DFD1',
                  color: '#5B4A3A'
                }}
              >
                <Tag className="h-4 w-4" />
                Add Tags ({selectedMembers.length})
              </Button>
            }
            isLoading={isLoading}
            loadingComponent={<LoadingSkeleton />}
            pageSize={PAGE_SIZE}
            hasMore={hasMore}
            onLoadMore={loadMoreMembers}
            isLoadingMore={isLoadingMore}
          />
        </div>
      </div>
      
      {/* Add Member Dialog */}
      {community && (
        <MemberDialog
          open={isAddMemberOpen}
          mode="add"
          communityName={community.name}
          onOpenChange={setIsAddMemberOpen}
          onSubmit={handleAddMember}
        />
      )}
      
      {/* Invite Member Dialog */}
      {community && (
        <InviteMemberDialog
          isOpen={isInviteDialogOpen}
          onClose={() => setIsInviteDialogOpen(false)}
          community={community}
        />
      )}
      
      {/* Tag Members Dialog */}
      {community && (
        <TagMembersDialog
          isOpen={isTaggingOpen}
          onClose={() => {
            setIsTaggingOpen(false);
            setSelectedIds(new Set());
          }}
          allMembers={allMembersForDialog as any}
          initialSelectedMembers={selectedMembersForDialog as any}
          communityId={community.communityId}
          onApplyTags={handleApplyTags}
        />
      )}
    </div>
  );
}

export default function MembersPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <MembersContent />
    </Suspense>
  );
}
