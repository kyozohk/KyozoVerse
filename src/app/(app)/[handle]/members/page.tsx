
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { collection, query, where, orderBy, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { type CommunityMember, type Community, type User } from "@/lib/types";
import { getUserRoleInCommunity, getCommunityByHandle } from "@/lib/community-utils";
import { MembersList } from "@/components/community/members-list";
import { Skeleton } from "@/components/ui/skeleton";
import { doc } from "firebase/firestore";

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
                    <Skeleton className="h-10 flex-grow" />
                    <div className="flex items-center gap-1 rounded-md p-1">
                        <Skeleton className="h-9 w-9" />
                        <Skeleton className="h-9 w-9" />
                    </div>
                </div>
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({length: 6}).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
                </div>
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
