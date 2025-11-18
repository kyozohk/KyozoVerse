
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { collection, query, where, getDocs, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { type CommunityMember } from "@/lib/types";
import { getUserRoleInCommunity, getCommunityByHandle } from "@/lib/community-utils";
import { MemberCard } from "@/components/community/member-card";
import { ListView } from "@/components/ui/list-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function CommunityMembersPage() {
  const { user } = useAuth();
  const params = useParams();
  const handle = params.handle as string;
  
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [userRole, setUserRole] = useState<string>("guest");
  const [communityId, setCommunityId] = useState<string>("");
  
  useEffect(() => {
    async function fetchCommunityAndRole() {
      if (!handle) return;
      
      try {
        const communityData = await getCommunityByHandle(handle);
        
        if (communityData) {
          setCommunityId(communityData.communityId);
          
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
    if (!communityId) return;

    const membersRef = collection(db, "communityMembers");
    const q = query(
      membersRef,
      where("communityId", "==", communityId),
      orderBy("joinedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const membersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }) as unknown as CommunityMember);
      setMembers(membersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching members:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [communityId]);

  const filteredMembers = members.filter(member => {
    const displayName = member.userDetails?.displayName?.toLowerCase() || "";
    const email = member.userDetails?.email?.toLowerCase() || "";
    const query = searchTerm.toLowerCase();
    return displayName.includes(query) || email.includes(query);
  });
  
  const canManageMembers = userRole === "owner" || userRole === "admin";
  
  return (
    <ListView
      title="Members"
      subtitle="Manage your community members."
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
    >
      {loading ? (
        Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)
      ) : (
        filteredMembers.map((member) => (
          <MemberCard key={member.userId} member={member} canManage={canManageMembers} />
        ))
      )}
    </ListView>
  );
}
