
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
import { Users, Search, UserPlus, List, LayoutGrid, Edit, MessageCircle, Phone, Mail, Trash2 } from "lucide-react";
import { type CommunityMember } from "@/lib/types";
import { getUserRoleInCommunity, getCommunityByHandle } from "@/lib/community-utils";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

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
    <div className="p-6 md:p-8">
      <div className="bg-card text-foreground p-6 md:p-8 rounded-xl border border-gray-200/80">
        <div className="flex items-center justify-between gap-4 mb-6">
            <div>
            <h2 className="text-2xl font-bold text-foreground">Members</h2>
            <p className="text-muted-foreground">Manage your community members.</p>
            </div>
            <div className="flex items-center gap-4">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 bg-card border-primary-purple text-foreground focus:ring-primary-purple"
                />
            </div>
            <div className="flex items-center gap-1 rounded-md bg-gray-800 p-1">
                <Button
                variant={'secondary'}
                size="icon"
                className="h-8 w-8 text-white hover:bg-gray-700"
                >
                <List className="h-4 w-4" />
                </Button>
                <Button
                variant={'ghost'}
                size="icon"
                className="h-8 w-8 text-white hover:bg-gray-700"
                >
                <LayoutGrid className="h-4 w-4" />
                </Button>
            </div>
            </div>
        </div>
        
        {loading ? (
            <div className="text-center text-muted-foreground py-10">Loading members...</div>
        ) : (
            <div className="grid grid-cols-1 gap-4">
            {filteredMembers.map((member) => (
                <div key={member.userId} className="flex items-center justify-between p-3 border border-gray-200/80 rounded-md hover:border-primary-purple transition-colors">
                    <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={member.userDetails?.avatarUrl} />
                        <AvatarFallback>
                        {member.userDetails?.displayName?.charAt(0) || "U"}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-medium text-foreground">{member.userDetails?.displayName}</p>
                        <p className="text-sm text-muted-foreground">{member.userDetails?.email}</p>
                    </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Badge
                            variant={
                            member.status === 'active' ? 'default' : 'destructive'
                            }
                            className={
                            member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }
                        >
                            {member.status}
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                            {member.joinedAt ? format(member.joinedAt.toDate(), 'PP') : '-'}
                        </div>
                        {canManageMembers && (
                        <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <MessageCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <Phone className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <Mail className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-400">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        )}
                    </div>
                </div>
                ))}
            </div>
        )}
        </div>
    </div>
  );
}
