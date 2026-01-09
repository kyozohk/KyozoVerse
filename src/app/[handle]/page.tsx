
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getCommunityByHandle, getUserRoleInCommunity, getCommunityMembers } from '@/lib/community-utils';
import { Community, CommunityMember, UserRole } from '@/lib/types';
import { CommunityHeader } from '@/components/community/community-header';
import { CommunityStats } from '@/components/community/community-stats';
import { MembersList } from '@/components/community/members-list';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateCommunityDialog } from '@/components/community/create-community-dialog';
import { MemberDialog } from '@/components/community/member-dialog';
import { DeleteCommunityDialog } from '@/components/community/delete-community-dialog';
import { InviteMemberDialog } from '@/components/community/invite-member-dialog';
import { collection, query, where, onSnapshot, getDocs, getDoc, deleteDoc, doc, addDoc, setDoc, serverTimestamp, increment, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { communityAuth } from '@/firebase/community-auth';
import { ListView } from '@/components/ui/list-view';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';

export default function CommunityPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const handle = params.handle as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [editingMember, setEditingMember] = useState<CommunityMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<CommunityMember | null>(null);
  const [isDeleteMemberConfirmOpen, setIsDeleteMemberConfirmOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    const fetchCommunityData = async () => {
      if (!handle) return;
      setLoading(true);

      try {
        const communityData = await getCommunityByHandle(handle);
        setCommunity(communityData);

        if (communityData) {
          if (user) {
            const role = await getUserRoleInCommunity(user.uid, communityData.communityId);
            setUserRole(role);
          }
          
          const membersData = await getCommunityMembers(communityData.communityId);
          setMembers(membersData);
        }

      } catch (error) {
        console.error('Error fetching community data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCommunityData();
  }, [handle, user, authLoading]);
  
  const handleCommunityUpdated = () => {
    if (!authLoading) {
      setLoading(true);
      getCommunityByHandle(handle).then(communityData => {
        setCommunity(communityData);
        setLoading(false);
      });
    }
  };

  const handleEditMemberSubmit = async (data: {
    displayName: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
    coverUrl?: string;
  }) => {
    if (!editingMember?.id) {
      throw new Error("No member selected to edit or member is missing document ID.");
    }
    try {
      const memberRef = doc(db, "communityMembers", editingMember.id);
      const updateData: any = {
        'userDetails.displayName': data.displayName,
        'userDetails.email': data.email,
        'userDetails.phone': data.phone || '',
        'userDetails.avatarUrl': data.avatarUrl || '',
        'userDetails.coverUrl': data.coverUrl || '',
      };
      await updateDoc(memberRef, updateData);
      setMembers(prev => prev.map(m => m.id === editingMember.id ? { ...m, userDetails: { ...m.userDetails, ...data } } : m));
      toast({ title: 'Success', description: 'Member updated.' });
    } catch (error) {
      console.error("Error updating member:", error);
      toast({ title: 'Error', description: 'Failed to update member.', variant: "destructive" });
    }
  };
  
  const handleDeleteMember = async () => {
    if (!memberToDelete || !community) return;
    try {
      await deleteDoc(doc(db, 'communityMembers', memberToDelete.id));
      await updateDoc(doc(db, 'communities', community.communityId), {
        memberCount: increment(-1),
      });
      setMembers(prev => prev.filter(m => m.id !== memberToDelete.id));
      toast({ title: 'Member removed', description: `${memberToDelete.userDetails?.displayName} has been removed.` });
    } catch (error) {
      console.error('Error deleting member:', error);
      toast({ title: 'Error', description: 'Failed to remove member.', variant: 'destructive' });
    } finally {
      setIsDeleteMemberConfirmOpen(false);
      setMemberToDelete(null);
    }
  };
  
  const handleAddMember = async (data: { displayName: string; email: string; phone?: string; }) => {
    if (!community?.communityId) {
      throw new Error("Community is not loaded yet.");
    }
    if (!data.email || !data.email.includes('@')) {
      throw new Error("A valid email address is required.");
    }
    if (!data.phone) {
      throw new Error("Phone number is required.");
    }
    
    // Normalize phone number
    let normalizedPhone = data.phone.trim().replace(/\s+/g, '');
    if (!normalizedPhone.startsWith('+')) {
      normalizedPhone = '+' + normalizedPhone;
    }
    
    // Create wa_id (WhatsApp ID) - phone without + and spaces
    const wa_id = normalizedPhone.replace(/\+/g, '').replace(/\s+/g, '');
    
    const usersRef = collection(db, "users");
    
    // Check if user exists
    const emailQuery = query(usersRef, where("email", "==", data.email));
    const phoneQuery = query(usersRef, where("phoneNumber", "==", normalizedPhone));
    const phoneQuery2 = query(usersRef, where("phone", "==", normalizedPhone));
    
    const [emailSnap, phoneSnap, phoneSnap2] = await Promise.all([
      getDocs(emailQuery),
      getDocs(phoneQuery),
      getDocs(phoneQuery2)
    ]);
    
    const existingByEmail = !emailSnap.empty;
    const existingByPhone = !phoneSnap.empty || !phoneSnap2.empty;
    
    if (existingByEmail || existingByPhone) {
      const existingUser = emailSnap.docs[0] || phoneSnap.docs[0] || phoneSnap2.docs[0];
      const userData = existingUser.data();
      throw new Error(
        `A user with this ${existingByEmail ? 'email' : 'phone number'} already exists (${userData.displayName || userData.email}).`
      );
    }
    
    // Create new user
    const tempPassword = Math.random().toString(36).slice(-8);
    const userCredential = await createUserWithEmailAndPassword(communityAuth, data.email, tempPassword);
    const userId = userCredential.user.uid;
    
    await setDoc(doc(db, "users", userId), {
      userId,
      displayName: data.displayName,
      email: data.email,
      phone: normalizedPhone,
      phoneNumber: normalizedPhone,
      wa_id: wa_id,
      createdAt: serverTimestamp(),
    });
    
    // Add to community members
    await addDoc(collection(db, "communityMembers"), {
      userId,
      communityId: community.communityId,
      role: 'member',
      status: 'active',
      joinedAt: serverTimestamp(),
      userDetails: {
        displayName: data.displayName,
        email: data.email,
        avatarUrl: null,
        phone: normalizedPhone,
      },
    });
    
    // Increment member count
    await updateDoc(doc(db, "communities", community.communityId), {
      memberCount: increment(1),
    });
  };

  const handleDeleteSuccess = () => {
    toast({
      title: "Community Deleted",
      description: "The community and all its data have been permanently removed.",
    });
    
    // Redirect to home
    router.push('/');
  };

  const filteredMembers = members.filter(member =>
    member.userDetails?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.userDetails?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || authLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-40 w-full rounded-none" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 md:px-8">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="px-4 md:px-8">
            <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!community) {
    return <div className="p-8 text-center text-foreground">Community not found.</div>;
  }

  // Calculate member count excluding owner
  const nonOwnerMembers = members.filter(m => m.role !== 'owner');
  const memberCountExcludingOwner = nonOwnerMembers.length;

  return (
    <div className="space-y-8">
      <CommunityHeader 
        community={community} 
        userRole={userRole} 
        onEdit={() => setIsEditDialogOpen(true)}
        onDelete={() => setIsDeleteConfirmOpen(true)}
        onAddMember={() => setIsAddMemberDialogOpen(true)}
        onInvite={() => setIsInviteDialogOpen(true)}
        memberCount={memberCountExcludingOwner}
      />
      <div className="px-4 md:px-8">
        <CommunityStats community={community} />
      </div>
      
      <ListView
          title="Members"
          subtitle={`Browse and manage ${community.name}'s members.`}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        >
          <MembersList 
            members={filteredMembers} 
            userRole={userRole} 
            viewMode={viewMode}
            onEditMember={(member) => setEditingMember(member)}
            onDeleteMember={(member) => {
              setMemberToDelete(member);
              setIsDeleteMemberConfirmOpen(true);
            }}
          />
      </ListView>

      {isEditDialogOpen && (
        <CreateCommunityDialog
          isOpen={isEditDialogOpen}
          setIsOpen={setIsEditDialogOpen}
          existingCommunity={community}
          onCommunityUpdated={handleCommunityUpdated}
        />
      )}

      {isAddMemberDialogOpen && community && (
        <MemberDialog
          open={isAddMemberDialogOpen}
          mode="add"
          communityName={community.name}
          onClose={() => setIsAddMemberDialogOpen(false)}
          onSubmit={async (data) => {
            try {
              await handleAddMember(data);
              setIsAddMemberDialogOpen(false);
              handleCommunityUpdated();
              toast({
                title: "Member Added",
                description: `${data.displayName} has been added to the community.`,
              });
            } catch (error: any) {
              toast({
                title: "Error",
                description: error.message || "Failed to add member",
                variant: "destructive",
              });
            }
          }}
        />
      )}
      
      {editingMember && (
        <MemberDialog
          open={!!editingMember}
          mode="edit"
          communityName={community.name}
          initialMember={editingMember}
          onClose={() => setEditingMember(null)}
          onSubmit={handleEditMemberSubmit}
        />
      )}

      {community && (
        <>
          <InviteMemberDialog
            isOpen={isInviteDialogOpen}
            onClose={() => setIsInviteDialogOpen(false)}
            community={community}
          />
          
          <DeleteCommunityDialog
            community={community}
            isOpen={isDeleteConfirmOpen}
            onClose={() => setIsDeleteConfirmOpen(false)}
            onSuccess={handleDeleteSuccess}
          />
        </>
      )}

      {isDeleteMemberConfirmOpen && memberToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Delete Member</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-6">Are you sure you want to remove <strong>{memberToDelete.userDetails?.displayName}</strong> from the community?</p>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setIsDeleteMemberConfirmOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDeleteMember}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
