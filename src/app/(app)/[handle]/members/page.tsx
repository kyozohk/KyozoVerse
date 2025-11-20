

"use client";

import { useState, useEffect } from "react";
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
} from "firebase/firestore";
import { db } from "@/firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { type CommunityMember, type Community, type User } from "@/lib/types";
import { getUserRoleInCommunity, getCommunityByHandle } from "@/lib/community-utils";
import { MembersList } from "@/components/community/members-list";
import { MemberDialog } from "@/components/community/member-dialog";
import { ListView } from '@/components/ui/list-view';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { communityAuth } from "@/firebase/community-auth";


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
      return
    };

    setLoading(true);
    const membersRef = collection(db, "communityMembers");
    const q = query(
      membersRef,
      where("communityId", "==", community.communityId),
      orderBy("joinedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const membersDataPromises = querySnapshot.docs.map(async (docSnap) => {
        const memberData = docSnap.data() as Omit<CommunityMember, 'userDetails'>;
        const userDocRef = doc(db, 'users', memberData.userId);
        const userSnap = await getDoc(userDocRef);
        const userDetails = userSnap.exists() ? userSnap.data() as User : undefined;
        return {
          id: docSnap.id,
          ...memberData,
          userDetails
        } as unknown as CommunityMember;
      });

      const membersData = await Promise.all(membersDataPromises);
      setMembers(membersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching members:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [community?.communityId]);

  const filteredMembers = members.filter(
    (member) =>
      member.userDetails?.displayName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      member.userDetails?.email
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
  );
  
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
  
    try {
      const usersRef = collection(db, "users");
      let userId: string;
      let userDetails: Partial<User>;
  
      // Look up user by email
      const q = query(usersRef, where("email", "==", data.email));
      const snap = await getDocs(q);
  
      if (snap.empty) {
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
                phone: data.phone,
                createdAt: serverTimestamp(),
            };
            
            await setDoc(doc(db, "users", userId), userDetails);
            console.log(`New user created with UID: ${userId}. A temporary password was used.`);
  
        } catch (authError: any) {
            if (authError.code === 'auth/email-already-in-use') {
                throw new Error("This email is already associated with an account in Firebase Authentication, but no profile was found in Firestore. Please resolve this inconsistency.");
            }
            throw authError;
        }
  
      } else {
        // User exists, use their data
        const userDoc = snap.docs[0];
        userId = userDoc.id;
        userDetails = userDoc.data() as User;
        // Ensure phone number is updated if it was provided
        if (data.phone && userDetails.phone !== data.phone) {
          await updateDoc(doc(db, "users", userId), { phone: data.phone });
          userDetails.phone = data.phone;
        }
        console.log(`Found existing user with UID: ${userId}`);
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
          phone: data.phone,
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
        onAddAction={() => setIsAddMemberOpen(true)}
      >
        <MembersList 
          members={filteredMembers} 
          userRole={userRole as any}
          viewMode={viewMode}
          onEditMember={(member) => setEditingMember(member)}
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
    </>
  );
}
