
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Users, Search, UserPlus } from "lucide-react";
import { type CommunityMember } from "@/lib/types";
import { getUserRoleInCommunity, getCommunityByHandle } from "@/lib/community-utils";

export default function CommunityMembersPage() {
  const { user } = useAuth();
  const params = useParams();
  const handle = params.handle as string;
  
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
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
  
  const filteredMembers = members.filter(member => {
    const displayName = member.userDetails?.displayName?.toLowerCase() || "";
    const email = member.userDetails?.email?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    
    return displayName.includes(query) || email.includes(query);
  });
  
  const canManageMembers = userRole === "owner" || userRole === "admin";
  
  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-8">
      <Card className="bg-transparent border-none text-white">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl text-white">Community Members</CardTitle>
              <CardDescription className="text-gray-400">
                Manage and view all members of @{handle}
              </CardDescription>
            </div>
            {canManageMembers && (
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Members
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-6 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              className="pl-9 bg-gray-700/50 border-gray-600/80 text-white focus:ring-primary-purple"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading members...</div>
          ) : (
            <div className="space-y-2">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <div key={member.userId} className="flex items-center justify-between p-3 border border-gray-700/80 rounded-md hover:bg-gray-800/50">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.userDetails?.avatarUrl} />
                        <AvatarFallback>
                          {member.userDetails?.displayName?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-white">{member.userDetails?.displayName}</p>
                        <p className="text-sm text-gray-400">{member.userDetails?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm capitalize bg-gray-700/50 px-2 py-1 rounded">
                        {member.role}
                      </span>
                      {canManageMembers && (
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                          Manage
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 flex flex-col items-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    {searchQuery ? "No members match your search" : "No members found"}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
