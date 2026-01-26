'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, addDoc, setDoc, doc, serverTimestamp, increment, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Community } from '@/lib/types';
import { Loader2, Edit, UserPlus, Mail } from 'lucide-react';
import { CommunityImage } from '@/components/ui/community-image';
import { RoundImage } from '@/components/ui/round-image';
import { CreateCommunityDialog } from '@/components/community/create-community-dialog';
import { MemberDialog } from '@/components/community/member-dialog';
import { InviteMemberDialog } from '@/components/community/invite-member-dialog';
import { Button } from '@/components/ui/button';
import { OverviewScreen } from '@/components/ui/figma/overview';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getUserRoleInCommunity } from '@/lib/community-utils';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { communityAuth } from '@/firebase/community-auth';

export default function CommunityPage() {
  const params = useParams();
  const handle = params.handle as string;
  const { user } = useAuth();
  const { toast } = useToast();
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const communityQuery = query(collection(db, 'communities'), where('handle', '==', handle));
        const snapshot = await getDocs(communityQuery);
        if (!snapshot.empty) {
          const communityData = { communityId: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Community;
          setCommunity(communityData);
          
          // Fetch user role
          if (user) {
            const role = await getUserRoleInCommunity(user.uid, communityData.communityId);
            setUserRole(role);
          }
        }
      } catch (error) {
        console.error('Error fetching community:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCommunity();
  }, [handle, user]);

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
  };

  const canManage = userRole === 'owner' || userRole === 'admin';

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!community) {
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
          {community.communityBackgroundImage && (
            <CommunityImage 
              src={community.communityBackgroundImage} 
              alt={community.name} 
              fill 
              containerClassName="relative h-48"
              className="object-cover" 
            />
          )}
          <div className="p-8">
            <div className="flex items-start gap-6">
              {community.communityProfileImage && (
                <RoundImage 
                  src={community.communityProfileImage} 
                  alt={community.name} 
                  size={120}
                  border={true}
                />
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold tracking-tight">{community.name}</h1>
                {community.tagline && (
                  <p className="text-muted-foreground mt-2">{community.tagline}</p>
                )}
                {(community as any).location && (
                  <p className="text-sm text-muted-foreground mt-1">📍 {(community as any).location}</p>
                )}
                {(community as any).mantras && (
                  <p className="text-sm mt-3 whitespace-pre-wrap">{(community as any).mantras}</p>
                )}
                {Array.isArray((community as any).tags) && (community as any).tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {(community as any).tags.map((tag: string) => (
                      <span key={tag} className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-sm font-semibold">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {canManage && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsInviteDialogOpen(true)}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Invite
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddMemberOpen(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Member
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditDialogOpen(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Overview Screen Component */}
        <OverviewScreen />
      </div>
      <CreateCommunityDialog 
        isOpen={isEditDialogOpen} 
        setIsOpen={setIsEditDialogOpen}
        existingCommunity={community}
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
    </div>
  );
}
