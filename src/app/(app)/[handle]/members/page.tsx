
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { type CommunityMember, type Community, type User } from "@/lib/types";
import { getUserRoleInCommunity, getCommunityByHandle } from "@/lib/community-utils";
import { MembersList } from "@/components/community/members-list";
import { ListView } from "@/components/ui/list-view";

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
    if (!community?.communityId) return;

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
  
  return (
    <ListView
      title="Members"
      subtitle="Browse and manage community members."
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      loading={loading}
    >
        <MembersList 
            members={filteredMembers} 
            userRole={userRole} 
            viewMode={viewMode}
        />
    </ListView>
  );
}
