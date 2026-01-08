

'use client';

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
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
  arrayRemove
} from "firebase/firestore";
import { db } from "@/firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { type Community, type User } from "@/lib/types";
import { getUserRoleInCommunity, getCommunityByHandle, getCommunityMembers } from "@/lib/community-utils";
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
  }) => {
    if (!community?.communityId) {
      throw new Error("Community is not loaded yet.");
    }
    if (!data.email || !data.email.includes('@')) {
      throw new Error("A valid email address is required to create a new user.");
    }
    
    // Validate and normalize phone number
    if (!data.phone) {
      throw new Error("Phone number is required.");
    }
    
    // Normalize phone number: ensure it starts with +
    let normalizedPhone = data.phone.trim().replace(/\s+/g, '');
    if (!normalizedPhone.startsWith('+')) {
      normalizedPhone = '+' + normalizedPhone;
    }
    
    // Create wa_id (WhatsApp ID) - phone without + and spaces
    const wa_id = normalizedPhone.replace(/\+/g, '').replace(/\s+/g, '');
    
    console.log('[Add Member] Normalized phone:', normalizedPhone, 'wa_id:', wa_id);
  
    try {
      const usersRef = collection(db, "users");
      let userId: string;
      let userDetails: Partial<User>;
  
      // Check if user exists by email OR phone
      const emailQuery = query(usersRef, where("email", "==", data.email));
      const phoneQuery = query(usersRef, where("phoneNumber", "==", normalizedPhone));
      const phoneQuery2 = query(usersRef, where("phone", "==", normalizedPhone));
      
      const [emailSnap, phoneSnap, phoneSnap2] = await Promise.all([
        getDocs(emailQuery),
        getDocs(phoneQuery),
        getDocs(phoneQuery2)
      ]);
      
      // Check if user exists by email or phone - reuse if found
      const existingByEmail = !emailSnap.empty;
      const existingByPhone = !phoneSnap.empty || !phoneSnap2.empty;
      
      let snap = emailSnap;
      
      if (existingByEmail || existingByPhone) {
        // User exists - reuse them
        const existingUser = emailSnap.docs[0] || phoneSnap.docs[0] || phoneSnap2.docs[0];
        userId = existingUser.id;
        userDetails = existingUser.data() as User;
        
        console.log(`Found existing user: ${userDetails.displayName || userDetails.email} (${userId}). Reusing for community.`);
        
        // Update phone if needed
        const updateData: any = {};
        if (normalizedPhone && (userDetails as any).phone !== normalizedPhone) {
          updateData.phone = normalizedPhone;
          updateData.phoneNumber = normalizedPhone;
          updateData.wa_id = wa_id;
          (userDetails as any).phone = normalizedPhone;
        } else if (!(userDetails as any).wa_id) {
          updateData.wa_id = wa_id;
        }
        if (Object.keys(updateData).length > 0) {
          await updateDoc(doc(db, "users", userId), updateData);
        }
      } else {
        // User does not exist, create a new one
        console.log(`No user found with email ${data.email}. Creating a new user.`);
        
        const tempPassword = Math.random().toString(36).slice(-8);
        
        try {
            const userCredential = await createUserWithEmailAndPassword(communityAuth, data.email, tempPassword);
            userId = userCredential.user.uid;
            
            userDetails = {
                userId: userId,
                displayName: data.displayName,
                email: data.email,
                phone: normalizedPhone,
                phoneNumber: normalizedPhone,
                wa_id: wa_id,
                createdAt: serverTimestamp(),
            } as unknown as User;
            
            await setDoc(doc(db, "users", userId), userDetails);
            console.log(`New user created with UID: ${userId}, phone: ${normalizedPhone}, wa_id: ${wa_id}. A temporary password was used.`);
  
        } catch (authError: any) {
            if (authError.code === 'auth/email-already-in-use') {
                throw new Error("This email is already associated with an account in Firebase Authentication, but no profile was found in Firestore. Please resolve this inconsistency.");
            }
            throw authError;
        }
      }
  
      // Add user to the community members subcollection
      const membersRef = collection(db, "communityMembers");
      await addDoc(membersRef, {
        userId,
        communityId: community.communityId,
        role: "member",
        status: "active",
        joinedAt: serverTimestamp(),
        userDetails: {
          displayName: data.displayName,
          email: data.email,
          avatarUrl: userDetails.avatarUrl || null,
          phone: normalizedPhone,
        },
      });
  
      // Increment member count on the community
      const communityRef = doc(db, "communities", community.communityId);
      await updateDoc(communityRef, {
        memberCount: increment(1),
      });
  
    } catch (error: any) {
      console.error("Error adding member:", error);
      throw new Error(error?.message || "Unable to add member. Please try again.");
    }
  };

  const handleEditMemberSubmit = async (data: {
    displayName: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
    coverUrl?: string;
  }) => {
    if (!editingMember?.userId) {
        throw new Error("No member selected to edit or member is missing ID.");
    }

    try {
        const userRef = doc(db, "users", editingMember.userId);
        
        const updateData: Partial<User> = {
            displayName: data.displayName,
            email: data.email,
            phone: data.phone,
        };

        if (data.avatarUrl) {
            updateData.avatarUrl = data.avatarUrl;
        }
        if (data.coverUrl) {
            updateData.coverUrl = data.coverUrl;
        }

        await updateDoc(userRef, updateData);
        
        const memberRef = doc(db, "communityMembers", (editingMember as any).id);
        await updateDoc(memberRef, {
            'userDetails.displayName': data.displayName,
            'userDetails.email': data.email,
            'userDetails.phone': data.phone,
            'userDetails.avatarUrl': data.avatarUrl || editingMember.userDetails?.avatarUrl,
        });

    } catch (error: any) {
        console.error("Error updating member:", error);
        throw new Error(error?.message || "Unable to update member. Please try again.");
    }
  };


  return (
    <>
      <ListView
        title="Members"
        subtitle="Browse and manage community members."
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        loading={loading}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsInviteDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Invite
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddMemberOpen(true)}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Add
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('Import button clicked');
                setIsImportDialogOpen(true);
              }}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>
          </div>
        }
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
    </>
  );
}
