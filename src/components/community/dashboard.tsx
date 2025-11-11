"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/firebase/firestore";
import { Community, CommunityMember, User } from "@/lib/types";
import { Users, Settings, BarChart, FileText } from "lucide-react";

interface DashboardProps {
  community: Community;
  userId: string;
}

export function CommunityDashboard({ community, userId }: DashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPosts: 0,
    publicPosts: 0,
    privatePosts: 0,
    totalViews: 0,
    totalLikes: 0
  });

  useEffect(() => {
    async function fetchMembers() {
      try {
        const membersRef = collection(db, "communityMembers");
        const q = query(
          membersRef,
          where("communityId", "==", community.communityId),
          orderBy("joinedAt", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        const membersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Type assertion with proper casting
        setMembers(membersData as unknown as CommunityMember[]);
      } catch (error) {
        console.error("Error fetching members:", error);
      } finally {
        setLoading(false);
      }
    }

    async function fetchStats() {
      try {
        // Get posts stats
        const postsRef = collection(db, "blogs");
        const postsQuery = query(
          postsRef,
          where("communityId", "==", community.communityId)
        );
        
        const postsSnapshot = await getDocs(postsQuery);
        
        let publicCount = 0;
        let privateCount = 0;
        let totalLikes = 0;
        
        postsSnapshot.docs.forEach(doc => {
          const post = doc.data();
          if (post.visibility === "public") {
            publicCount++;
          } else {
            privateCount++;
          }
          totalLikes += post.likes || 0;
        });
        
        setStats({
          totalPosts: postsSnapshot.size,
          publicPosts: publicCount,
          privatePosts: privateCount,
          totalViews: 0, // Would need a view counter implementation
          totalLikes
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    }

    fetchMembers();
    fetchStats();
  }, [community.communityId]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Community Dashboard</CardTitle>
          <CardDescription>
            Manage your community, members, and content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="members" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Members</span>
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Content</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Members
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{community.memberCount}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Posts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalPosts}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.publicPosts} public, {stats.privatePosts} private
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Likes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalLikes}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Community Handle
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">@{community.handle}</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="members" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Community Members</h3>
                <Button size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Invite Members
                </Button>
              </div>
              
              {loading ? (
                <div className="text-center py-8">Loading members...</div>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div key={member.userId} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.userDetails?.avatarUrl} />
                          <AvatarFallback>
                            {member.userDetails?.displayName?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.userDetails?.displayName}</p>
                          <p className="text-sm text-muted-foreground">{member.userDetails?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm capitalize bg-secondary px-2 py-1 rounded">
                          {member.role}
                        </span>
                        <Button variant="ghost" size="sm">
                          Manage
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {members.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No members found
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="content" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Community Content</h3>
                <Button size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Create Post
                </Button>
              </div>
              
              <p className="text-muted-foreground">
                Manage your community's content, create new posts, and moderate existing ones.
              </p>
              
              {/* Content management would go here */}
              <div className="text-center py-8 text-muted-foreground">
                Content management features coming soon
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Community Settings</h3>
                <Button size="sm" variant="outline">
                  Save Changes
                </Button>
              </div>
              
              <p className="text-muted-foreground">
                Configure your community settings, privacy options, and more.
              </p>
              
              {/* Settings would go here */}
              <div className="text-center py-8 text-muted-foreground">
                Settings features coming soon
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
