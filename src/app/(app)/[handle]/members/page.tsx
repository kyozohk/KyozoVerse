
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { type CommunityMember, UserRole } from "@/lib/types";
import { getUserRoleInCommunity, getCommunityByHandle } from "@/lib/community-utils";
import { MembersList } from "@/components/community/members-list";
import { Skeleton } from "@/components/ui";

export default function CommunityMembersPage() {
  const { user } = useAuth();
  const params = useParams();
  const handle = params.handle as string;
  
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>("guest");
  
  useEffect(() => {
    async function fetchCommunityAndRole() {
      if (!handle) return;
      
      try {
        const communityData = await getCommunityByHandle(handle);
        
        if (communityData) {
          if (user) {
            const role = await getUserRoleInCommunity(user.uid, communityData.communityId);
            setUserRole(role);
          }
          
          await fetchMembers(communityData.communityId);
        }
      } catch (error) {
        console.error("Error fetching community data:", error);
      }
    }
    
    fetchCommunityAndRole();
  }, [handle, user]);
  
  async function fetchMembers(communityId: string) {
    try {
      const membersRef = collection(db, "communityMembers");
      const q = query(
        membersRef,
        where("communityId", "==", communityId),
        orderBy("joinedAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const membersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setMembers(membersData as unknown as CommunityMember[]);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="p-6 md:p-8">
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <MembersList members={members} userRole={userRole} />
      )}
    </div>
  );
}
