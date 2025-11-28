

"use client";

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

    // Query Firestore communityMembers collection
    const membersRef = collection(db, 'communityMembers');
    const q = query(
      membersRef,
      where('communityId', '==', community.communityId),
      orderBy('joinedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      setLoading(true);
      try {
        const membersData = await getCommunityMembers(community!.communityId, debouncedSearchTerm);
        setMembers(membersData);
      } catch (error) {
        console.error("Error fetching members:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [community?.communityId, debouncedSearchTerm]);
  
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
      
      // Check if user exists by email or phone
      const existingByEmail = !emailSnap.empty;
      const existingByPhone = !phoneSnap.empty || !phoneSnap2.empty;
      
      if (existingByEmail || existingByPhone) {
        const existingUser = emailSnap.docs[0] || phoneSnap.docs[0] || phoneSnap2.docs[0];
        const userData = existingUser.data();
        throw new Error(
          `A user with this ${existingByEmail ? 'email' : 'phone number'} already exists (${userData.displayName || userData.email}). Please use a different ${existingByEmail ? 'email' : 'phone number'} or ask them to login.`
        );
      }
      
      const snap = emailSnap;
  
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
  
      } else {
        // User exists, use their data
        const userDoc = snap.docs[0];
        userId = userDoc.id;
        userDetails = userDoc.data() as User;
        // Ensure phone number and wa_id are updated if needed
        const updateData: any = {};
        if (normalizedPhone && (userDetails as any).phone !== normalizedPhone) {
          updateData.phone = normalizedPhone;
          updateData.phoneNumber = normalizedPhone;
          updateData.wa_id = wa_id;
          (userDetails as any).phone = normalizedPhone;
        } else if (!(userDetails as any).wa_id) {
          // Add wa_id if it doesn't exist
          updateData.wa_id = wa_id;
        }
        if (Object.keys(updateData).length > 0) {
          await updateDoc(doc(db, "users", userId), updateData);
        }
        console.log(`Found existing user with UID: ${userId}, phone: ${normalizedPhone}, wa_id: ${wa_id}`);
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
        onAddAction={() => setIsAddMemberOpen(true)}
      >
        <MembersList 
          members={members} 
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
