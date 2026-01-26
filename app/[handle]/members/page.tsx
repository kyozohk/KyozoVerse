'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { collection, query, where, getDocs, addDoc, setDoc, doc, serverTimestamp, increment, updateDoc, orderBy, limit, startAfter, DocumentSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Community } from '@/lib/types';
import { Loader2, UserPlus, Mail } from 'lucide-react';
import { PageLayout } from '@/components/v2/page-layout';
import { PageHeader } from '@/components/v2/page-header';
import { EnhancedListView } from '@/components/v2/enhanced-list-view';
import { MemberGridItem, MemberListItem, MemberCircleItem } from '@/components/v2/member-items';
import { Button } from '@/components/ui/button';
import { MemberDialog } from '@/components/community/member-dialog';
import { InviteMemberDialog } from '@/components/community/invite-member-dialog';
import { useAuth } from '@/hooks/use-auth';
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
  const [userRole, setUserRole] = useState<string | null>(null);
  
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
      avatarUrl: data.avatarUrl || '',
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
        avatarUrl: data.avatarUrl || null,
        phone: normalizedPhone,
      },
    });
    
    // Increment member count
    await updateDoc(doc(db, "communities", community.communityId), {
      memberCount: increment(1),
    });
    
    toast({
      title: 'Member Added',
      description: `${data.displayName} has been added to the community.`,
    });
    
    // Add new member to the list immediately (at the beginning since sorted by joinedAt desc)
    const newMember: MemberData = {
      id: 'temp-' + Date.now(), // Will be replaced on next full fetch
      userId: userId,
      name: data.displayName,
      email: data.email,
      imageUrl: data.avatarUrl || '/placeholder-avatar.png',
      role: 'member',
      joinedDate: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
    };
    setMembers(prev => [newMember, ...prev]);
  };

  const canManage = userRole === 'owner' || userRole === 'admin';

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
        title={community ? `${community.name} - Members` : 'Members'}
        description="Manage your community members"
        actions={
          canManage ? (
            <>
              <Button variant="outline" onClick={() => setIsInviteDialogOpen(true)}>
                <Mail className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
              <Button onClick={() => setIsAddMemberOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </>
          ) : null
        }
      />
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
        selectable={false}
        isLoading={isLoading}
        loadingComponent={<LoadingSkeleton />}
        pageSize={PAGE_SIZE}
        hasMore={hasMore}
        onLoadMore={loadMoreMembers}
        isLoadingMore={isLoadingMore}
      />
      
      {/* Add Member Dialog */}
      {community && (
        <MemberDialog
          open={isAddMemberOpen}
          mode="add"
          communityName={community.name}
          onClose={() => setIsAddMemberOpen(false)}
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
    </PageLayout>
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
