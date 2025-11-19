
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { type CommunityMember, type Community, type User } from "@/lib/types";
import { getUserRoleInCommunity, getCommunityByHandle } from "@/lib/community-utils";
import { MembersList } from "@/components/community/members-list";
import { MemberListSkeleton } from "@/components/community/member-list-skeleton";

export default function CommunityMembersPage() {
  const { user } = useAuth();
  const params = useParams();
  const handle = params.handle as string;
  
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("guest");
  const [community, setCommunity] = useState<Community | null>(null);
  
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
  
  if (loading || !community) {
    return (
        <div className="p-6 md:p-8">
            <div className="bg-card text-foreground p-6 md:p-8 rounded-xl border border-gray-200/80">
                <div className="flex items-center justify-between gap-4 mb-6">
                   <div className="animate-pulse bg-muted h-10 flex-grow rounded-md"></div>
                    <div className="flex items-center gap-1 rounded-md p-1">
                        <div className="animate-pulse bg-muted h-9 w-9 rounded-md"></div>
                        <div className="animate-pulse bg-muted h-9 w-9 rounded-md"></div>
                    </div>
                </div>
                <MemberListSkeleton count={6} />
            </div>
        </div>
    )
  }
  
  return (
    <MembersList
      community={community}
      members={members}
      userRole={userRole}
    />
  );
}
