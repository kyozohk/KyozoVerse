

'use client';

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
  increment,
  setDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc
} from "firebase/firestore";
import { db } from "@/firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { type Community, type User } from "@/lib/types";
import { getUserRoleInCommunity, getCommunityByHandle, getCommunityMembers, joinCommunity } from "@/lib/community-utils";
import { MembersList } from "@/components/community/members-list";
import { MemberDialog } from "@/components/community/member-dialog";
import { ListView } from '@/components/ui/list-view';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { communityAuth } from "@/firebase/community-auth";
import { CommunityMember } from "@/lib/types";
import { TagMembersDialog } from "@/components/community/tag-members-dialog";
import { RemoveTagDialog } from "@/components/community/remove-tag-dialog";
import { addTagsToCommunity, getCommunityTags, type CommunityTag } from "@/lib/community-tags";
import { InviteMemberDialog } from "@/components/community/invite-member-dialog";
import { ImportMembersDialog } from "@/components/community/import-members-dialog";
import { UserPlus, Mail, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommunityHeader } from "@/components/community/community-header";
import { CustomButton } from "@/components/ui";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { getThemeForPath } from "@/lib/theme-utils";

// A simple debounce hook
function useDebounce(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}


export default function CommunityMembersPage() {
  const { user } = useAuth();
  const params = useParams();
  const handle = params.handle as string;
  const router = useRouter();
  const pathname = usePathname();
  const { activeColor } = getThemeForPath(pathname);
  
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("guest");
  const [community, setCommunity] = useState<Community | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<CommunityMember | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<CommunityMember[]>([]);
  const [isTaggingOpen, setIsTaggingOpen] = useState(false);
  const [availableTags, setAvailableTags] = useState<CommunityTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<CommunityMember | null>(null);

  // State for remove tag confirmation
  const [tagToRemove, setTagToRemove] = useState<{ memberId: string; tag: string } | null>(null);
  const [isRemoveTagDialogOpen, setIsRemoveTagDialogOpen] = useState(false);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    async function fetchCommunityAndRole() {
      if (!handle) return;
      
      try {
        const communityData = await getCommunityByHandle(handle);
        
        if (communityData) {
          setCommunity(communityData);
          
          if (user) {
            const role = await getUserRoleInCommunity(user.uid, communityData.communityId);
            setUserRole(role);
          }
          
          // Fetch available tags for this community
          const tags = await getCommunityTags(communityData.communityId);
          setAvailableTags(tags);
        }
      } catch (error) {
        console.error("Error fetching community data:", error);
      }
    }
    
    fetchCommunityAndRole();
  }, [handle, user]);
  
  useEffect(() => {
    if (!community?.communityId) {
      setLoading(false);
      return;
    }

    async function fetchMembers() {
      setLoading(true);
      try {
        const membersData = await getCommunityMembers(community!.communityId, { type: 'name', value: debouncedSearchTerm });
        console.log('✅ [Members Page] - Fetched members data:', JSON.stringify(membersData, null, 2));
        setMembers(membersData);
      } catch (error) {
        console.error("Error fetching members:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchMembers();
  }, [community?.communityId, debouncedSearchTerm]);

  const handleToggleMemberSelection = (member: CommunityMember) => {
    setSelectedMembers((prevSelected) => {
      if (prevSelected.some(m => m.id === member.id)) {
        return prevSelected.filter(m => m.id !== member.id);
      } else {
        return [...prevSelected, member];
      }
    });
  };

  const handleApplyTags = async (tagsToAdd: string[], tagsToRemove: string[]) => {
    if (!community?.communityId) {
      console.error('❌ [Applying Tags] No community ID available');
      return;
    }

    const memberIds = selectedMembers.map(m => m.id);
    console.log(`🏷️ [Applying Tags] Updating ${memberIds.length} members.`);
    console.log(`🏷️ [Applying Tags] Tags to add:`, tagsToAdd);
    console.log(`🏷️ [Applying Tags] Tags to remove:`, tagsToRemove);
    
    try {
      // First, save any new tags to the community's tags subcollection
      if (tagsToAdd.length > 0) {
        console.log(`🏷️ [Applying Tags] Saving new tags to community subcollection...`);
        await addTagsToCommunity(community.communityId, tagsToAdd);
        console.log(`✅ [Applying Tags] Tags saved to community`);
      }

      // Then update all selected members
      const updates = memberIds.map(async (id) => {
        const memberRef = doc(db, 'communityMembers', id);
        console.log(`  - Updating member ${id}: ADD [${tagsToAdd.join(', ')}], REMOVE [${tagsToRemove.join(', ')}]`);
        
        try {
          // Add new tags if any
          if (tagsToAdd.length > 0) {
            await updateDoc(memberRef, {
              tags: arrayUnion(...tagsToAdd),
            });
            console.log(`  ✅ Added tags to member ${id}`);
          }
          
          // Remove tags if any (only from member, not from community)
          if (tagsToRemove.length > 0) {
            await updateDoc(memberRef, {
              tags: arrayRemove(...tagsToRemove),
            });
            console.log(`  ✅ Removed tags from member ${id}`);
          }
        } catch (error) {
          console.error(`  ❌ Error updating member ${id}:`, error);
          throw error;
        }
      });
    
      await Promise.all(updates);
      console.log('✅ [Applying Tags] - All members updated in database.');
      
      // Refresh members data
      const membersData = await getCommunityMembers(community.communityId, { type: 'name', value: debouncedSearchTerm });
      console.log('✅ [Applying Tags] - Refreshed members data:', membersData.map(m => ({ id: m.id, tags: m.tags })));
      setMembers(membersData);
      setSelectedMembers([]); // Clear selection after applying
    } catch (error) {
      console.error("❌ [Applying Tags] Error:", error);
    }
  };

  const handleRemoveTag = async () => {
    if (!tagToRemove) return;
    try {
      const memberRef = doc(db, 'communityMembers', tagToRemove.memberId);
      await updateDoc(memberRef, {
        tags: arrayRemove(tagToRemove.tag),
      });

      // Refresh local state
      setMembers(prevMembers => prevMembers.map(m => {
        if (m.id === tagToRemove.memberId) {
          return { ...m, tags: m.tags?.filter(t => t !== tagToRemove.tag) };
        }
        return m;
      }));
    } catch (error) {
      console.error("Error removing tag:", error);
    } finally {
      setIsRemoveTagDialogOpen(false);
      setTagToRemove(null);
    }
  };

  const openRemoveTagDialog = (memberId: string, tag: string) => {
    setTagToRemove({ memberId, tag });
    setIsRemoveTagDialogOpen(true);
  };

  const handleToggleTag = (tagName: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tagName)) {
        return prev.filter(t => t !== tagName);
      } else {
        return [...prev, tagName];
      }
    });
  };

  // Filter members based on selected tags
  const filteredMembers = useMemo(() => {
    if (selectedTags.length === 0) {
      return members;
    }
    return members.filter(member => {
      const memberTags = member.tags || [];
      return selectedTags.every(selectedTag => memberTags.includes(selectedTag));
    });
  }, [members, selectedTags]);
  
  const handleAddMemberSubmit = async (data: {
    displayName: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
    coverUrl?: string;
  }) => {
    if (!community?.communityId) {
      throw new Error("Community is not loaded yet.");
    }
    if (!data.email || !data.email.includes('@')) {
      throw new Error("A valid email address is required to create a new user.");
    }
  
    // Validate and normalize phone number
    let normalizedPhone = data.phone?.trim().replace(/\s+/g, '') || '';
    if (normalizedPhone && !normalizedPhone.startsWith('+')) {
      normalizedPhone = '+' + normalizedPhone;
    }
  
    const wa_id = normalizedPhone.replace(/\+/g, '').replace(/\s+/g, '');
  
    const usersRef = collection(db, "users");
    
    // Check if user exists by email or phone number
    const emailQuery = query(usersRef, where("email", "==", data.email));
    let existingUserQuery = emailQuery;

    if (normalizedPhone) {
        const phoneQuery = query(usersRef, where("phone", "==", normalizedPhone));
        const phoneQuery2 = query(usersRef, where("phoneNumber", "==", normalizedPhone));
        // This is not a valid way to create an OR query in Firestore client SDK
        // but for the logic, we will check them sequentially
        const [emailSnap, phoneSnap, phoneSnap2] = await Promise.all([
          getDocs(emailQuery),
          getDocs(phoneQuery),
          getDocs(phoneQuery2),
        ]);
        const existingUserDoc = emailSnap.docs[0] || phoneSnap.docs[0] || phoneSnap2.docs[0];
        if (existingUserDoc) {
          const existingUserData = existingUserDoc.data() as User;
          const error: any = new Error("User already exists");
          error.code = "auth/user-already-exists";
          error.existingUser = {
            userId: existingUserDoc.id,
            ...existingUserData,
          };
          throw error;
        }
    } else {
        const emailSnap = await getDocs(emailQuery);
        if(!emailSnap.empty) {
            const existingUserDoc = emailSnap.docs[0];
            const existingUserData = existingUserDoc.data() as User;
            const error: any = new Error("User already exists");
            error.code = "auth/user-already-exists";
            error.existingUser = {
              userId: existingUserDoc.id,
              ...existingUserData,
            };
            throw error;
        }
    }
  
    return createUserWithEmailAndPassword(communityAuth, data.email, Math.random().toString(36).slice(-8))
      .then(userCredential => {
        const userId = userCredential.user.uid;
        const userDetails = {
          userId: userId,
          displayName: data.displayName,
          email: data.email,
          phone: normalizedPhone,
          phoneNumber: normalizedPhone,
          wa_id: wa_id,
          avatarUrl: data.avatarUrl || '',
          coverUrl: data.coverUrl || '',
          createdAt: serverTimestamp(),
        };

        const userDocRef = doc(db, "users", userId);
        return setDoc(userDocRef, userDetails)
          .then(() => ({ userId, userDetails }));
      })
      .then(({ userId, userDetails }) => {
        return joinCommunity(userId, community!.communityId, {
            displayName: data.displayName,
            email: data.email,
            avatarUrl: data.avatarUrl,
            phone: normalizedPhone
        });
      })
      .then(() => {
        const communityRef = doc(db, "communities", community!.communityId);
        return updateDoc(communityRef, { memberCount: increment(1) });
      })
      .catch(error => {
        if (error.code !== "auth/user-already-exists") {
            console.error("Error adding member:", error);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: '/users or /communityMembers',
              operation: 'create',
              requestResourceData: data
            }));
        }
        throw error;
      });
  };

  const handleEditMemberSubmit = async (data: {
    displayName: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
    coverUrl?: string;
  }) => {
    if (!editingMember?.userId) {
      throw new Error("No member selected to edit or member is missing user ID.");
    }

    try {
      // Only update the communityMembers collection
      // Community owners/admins can update member details here
      const memberRef = doc(db, "communityMembers", editingMember.id);
      
      // Build update object with only defined values
      const updateData: any = {
        'userDetails.displayName': data.displayName,
        'userDetails.email': data.email,
      };

      // Only add phone if it has a value
      if (data.phone) {
        updateData['userDetails.phone'] = data.phone;
      }

      // Only add avatarUrl if it has a value
      const finalAvatarUrl = data.avatarUrl || editingMember.userDetails?.avatarUrl;
      if (finalAvatarUrl) {
        updateData['userDetails.avatarUrl'] = finalAvatarUrl;
      }

      // Only add coverUrl if it has a value
      const finalCoverUrl = data.coverUrl || editingMember.userDetails?.coverUrl;
      if (finalCoverUrl) {
        updateData['userDetails.coverUrl'] = finalCoverUrl;
      }

      await updateDoc(memberRef, updateData);

      // Refresh the members list to show updated data
      if (community?.communityId) {
        const membersData = await getCommunityMembers(community.communityId, { type: 'name', value: debouncedSearchTerm });
        setMembers(membersData);
      }

    } catch (error: any) {
      console.error("Error updating member:", error);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `communityMembers/${editingMember.id}`,
          operation: 'update',
          requestResourceData: data,
      }));
      throw new Error(error?.message || "Unable to update member. Please try again.");
    }
  };

  // Calculate member count excluding owner
  const nonOwnerMembers = members.filter(m => m.role !== 'owner');
  const memberCountExcludingOwner = nonOwnerMembers.length;

  return (
    <div className="space-y-8">
      {community && (
        <CommunityHeader 
          community={community} 
          userRole={userRole as any} 
          onEdit={() => router.push(`/communities/${community.handle}/edit`)}
          onDelete={() => setIsDeleteConfirmOpen(true)}
          onAddMember={() => setIsAddMemberOpen(true)}
          onInvite={() => setIsInviteDialogOpen(true)}
          memberCount={memberCountExcludingOwner}
          customActions={
            <>
              <CustomButton 
                variant="rounded-rect" 
                className="text-white/80 hover:text-white hover:bg-white/10"
                onClick={() => setIsInviteDialogOpen(true)}
              >
                <Mail className="h-4 w-4 mr-2" />
                Invite
              </CustomButton>
              <CustomButton 
                variant="rounded-rect" 
                className="text-white/80 hover:text-white hover:bg-white/10"
                onClick={() => setIsAddMemberOpen(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add
              </CustomButton>
              <CustomButton 
                variant="rounded-rect" 
                className="text-white/80 hover:text-white hover:bg-white/10"
                onClick={() => {
                  console.log('Import button clicked');
                  setIsImportDialogOpen(true);
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </CustomButton>
            </>
          }
        />
      )}
      <ListView
        title="Members"
        subtitle="Browse and manage community members."
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        loading={loading}
        onAddTags={() => setIsTaggingOpen(true)}
        selectedCount={selectedMembers.length}
        availableTags={availableTags}
        selectedTags={selectedTags}
        onToggleTag={handleToggleTag}
      >
        <MembersList 
          members={filteredMembers} 
          userRole={userRole as any}
          viewMode={viewMode}
          onMemberClick={handleToggleMemberSelection}
          selectedMembers={selectedMembers}
          selectable={true}
          onEditMember={(member) => setEditingMember(member)}
          onRemoveTag={openRemoveTagDialog}
          onDeleteMember={(member) => {
            setMemberToDelete(member);
            setIsDeleteConfirmOpen(true);
          }}
          activeColor={activeColor}
        />
      </ListView>
      <MemberDialog
        open={isAddMemberOpen}
        mode="add"
        communityName={community?.name as string | undefined}
        onClose={() => setIsAddMemberOpen(false)}
        onSubmit={handleAddMemberSubmit}
      />
      <MemberDialog
        open={!!editingMember}
        mode="edit"
        communityName={community?.name as string | undefined}
        initialMember={editingMember}
        onClose={() => setEditingMember(null)}
        onSubmit={handleEditMemberSubmit}
      />
      <TagMembersDialog
        isOpen={isTaggingOpen}
        onClose={() => setIsTaggingOpen(false)}
        members={selectedMembers}
        communityId={community?.communityId || ''}
        onApplyTags={handleApplyTags}
      />
      <RemoveTagDialog
        isOpen={isRemoveTagDialogOpen}
        onClose={() => setIsRemoveTagDialogOpen(false)}
        onConfirm={handleRemoveTag}
        tagName={tagToRemove?.tag || ''}
      />
      {community && (
        <InviteMemberDialog
          isOpen={isInviteDialogOpen}
          onClose={() => setIsInviteDialogOpen(false)}
          community={community}
        />
      )}
      {community && (
        <ImportMembersDialog
          isOpen={isImportDialogOpen}
          onClose={() => setIsImportDialogOpen(false)}
          community={community}
          onSuccess={async () => {
            const membersData = await getCommunityMembers(community.communityId, { type: 'name', value: debouncedSearchTerm });
            setMembers(membersData);
          }}
        />
      )}
      
      {/* Delete Member Confirmation Dialog */}
      {isDeleteConfirmOpen && memberToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Delete Member</h2>
            <p className="mb-6">
              Are you sure you want to remove <strong>{memberToDelete.userDetails?.displayName}</strong> from this community? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setMemberToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={async () => {
                  try {
                    if (!community?.communityId || !memberToDelete.id) return;
                    
                    // Delete the community member document
                    await deleteDoc(doc(db, 'communityMembers', memberToDelete.id));
                    
                    // Decrement member count
                    const communityRef = doc(db, 'communities', community.communityId);
                    await updateDoc(communityRef, {
                      memberCount: increment(-1),
                    });
                    
                    // Refresh members list
                    const membersData = await getCommunityMembers(community.communityId, { type: 'name', value: debouncedSearchTerm });
                    setMembers(membersData);
                    
                    setIsDeleteConfirmOpen(false);
                    setMemberToDelete(null);
                  } catch (error) {
                    console.error('Error deleting member:', error);
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
