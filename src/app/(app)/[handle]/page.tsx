
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getCommunityByHandle, getUserRoleInCommunity } from '@/lib/community-utils';
import { Community, CommunityMember, UserRole } from '@/lib/types';
import { CommunityHeader } from '@/components/community/community-header';
import { CommunityStats } from '@/components/community/community-stats';
import { MembersList } from '@/components/community/members-list';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateCommunityDialog } from '@/components/community/create-community-dialog';
import { MemberDialog } from '@/components/community/member-dialog';
import { collection, query, where, onSnapshot, getDocs, deleteDoc, doc, addDoc, setDoc, serverTimestamp, increment, updateDoc } from 'firebase/firestore';
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
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
          
          const membersRef = collection(db, "communityMembers");
          const q = query(membersRef, where("communityId", "==", communityData.communityId));
          const unsubscribe = onSnapshot(q, (snapshot) => {
            const membersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as unknown as CommunityMember);
            setMembers(membersData);
          });
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
      role: "member",
      status: "active",
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

  const handleDeleteCommunity = async () => {
    if (!community) return;
    
    try {
      // Delete all community members
      const membersRef = collection(db, 'communityMembers');
      const membersQuery = query(membersRef, where('communityId', '==', community.communityId));
      const membersSnapshot = await getDocs(membersQuery);
      
      const deletePromises = membersSnapshot.docs.map(memberDoc => deleteDoc(memberDoc.ref));
      await Promise.all(deletePromises);
      
      // Delete the community document
      await deleteDoc(doc(db, 'communities', community.communityId));
      
      toast({
        title: "Community Deleted",
        description: "The community and all its members have been removed.",
      });
      
      // Redirect to home or communities list
      router.push('/');
    } catch (error) {
      console.error('Error deleting community:', error);
      toast({
        title: "Error",
        description: "Failed to delete community. Please try again.",
        variant: "destructive",
      });
    }
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

  return (
    <div className="space-y-8">
      <CommunityHeader 
        community={community} 
        userRole={userRole} 
        onEdit={() => setIsEditDialogOpen(true)}
        onDelete={() => setIsDeleteConfirmOpen(true)}
        onAddMember={() => setIsAddMemberDialogOpen(true)}
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
          <MembersList members={filteredMembers} userRole={userRole} viewMode={viewMode} />
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

      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Delete Community</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Are you sure you want to delete <strong>{community.name}</strong>? 
                This will remove all {members.length} members and cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={async () => {
                    setIsDeleteConfirmOpen(false);
                    await handleDeleteCommunity();
                  }}
                >
                  Delete Community
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
