
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart, LineChart, PieChart, Download, Calendar, ChevronDown, BarChart2, Users, Eye, ThumbsUp } from "lucide-react";
import { getUserRoleInCommunity, getCommunityByHandle } from "@/lib/community-utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// Mock data for analytics
const mockMemberGrowth = [
  { date: "2023-05", count: 10 },
  { date: "2023-06", count: 15 },
  { date: "2023-07", count: 18 },
  { date: "2023-08", count: 25 },
  { date: "2023-09", count: 32 },
  { date: "2023-10", count: 40 },
  { date: "2023-11", count: 45 }
];

const mockContentStats = {
  totalPosts: 28,
  publicPosts: 20,
  privatePosts: 8,
  totalViews: 1240,
  totalLikes: 356,
  totalComments: 89,
  postsByType: {
    text: 18,
    image: 8,
    video: 2
  }
};

const mockEngagementData = [
  { date: "2023-05", views: 120, likes: 45, comments: 12 },
  { date: "2023-06", views: 180, likes: 62, comments: 15 },
  { date: "2023-07", views: 150, likes: 48, comments: 10 },
  { date: "2023-08", views: 210, likes: 75, comments: 18 },
  { date: "2023-09", views: 280, likes: 95, comments: 22 },
  { date: "2023-10", views: 320, likes: 110, comments: 28 },
  { date: "2023-11", views: 290, likes: 105, comments: 25 }
];

export default function CommunityAnalyticsPage() {
  const { user } = useAuth();
  const params = useParams();
  const handle = params.handle as string;
  
  const [userRole, setUserRole] = useState<string>("guest");
  const [communityId, setCommunityId] = useState<string>("");
  const [communityName, setCommunityName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("last-30-days");
  
  useEffect(() => {
    async function fetchCommunityAndRole() {
      if (!handle || !user) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const communityData = await getCommunityByHandle(handle);
        
        if (communityData) {
          setCommunityId(communityData.communityId);
          setCommunityName(communityData.name);
          
          const role = await getUserRoleInCommunity(user.uid, communityData.communityId);
          setUserRole(role);
        } else {
          setUserRole('guest'); // No community found, treat as guest
        }
      } catch (error) {
        console.error("Error fetching community data:", error);
        setUserRole('guest');
      } finally {
        setLoading(false);
      }
    }
    
    fetchCommunityAndRole();
  }, [handle, user]);
  
  const canAccessAnalytics = userRole === "owner" || userRole === "admin";
  
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!canAccessAnalytics) {
    return (
      <div className="container mx-auto max-w-4xl p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Community Analytics</CardTitle>
            <CardDescription>
              Access to analytics is restricted to administrators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 flex flex-col items-center">
              <BarChart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
              <p className="text-muted-foreground">
                You don't have permission to view community analytics.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Community Analytics</CardTitle>
              <CardDescription>
                Track growth and engagement for @{handle}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{timeRange === "last-30-days" ? "Last 30 Days" : "All Time"}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList className="mb-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="members" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Members</span>
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>Content</span>
              </TabsTrigger>
              <TabsTrigger value="engagement" className="flex items-center gap-2">
                <ThumbsUp className="h-4 w-4" />
                <span>Engagement</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Members
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{mockMemberGrowth[mockMemberGrowth.length - 1].count}</div>
                    <p className="text-xs text-green-600">
                      +{mockMemberGrowth[mockMemberGrowth.length - 1].count - mockMemberGrowth[mockMemberGrowth.length - 2].count} this month
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Posts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{mockContentStats.totalPosts}</div>
                    <p className="text-xs text-muted-foreground">
                      {mockContentStats.publicPosts} public, {mockContentStats.privatePosts} private
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Views
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{mockContentStats.totalViews}</div>
                    <p className="text-xs text-green-600">
                      +{mockEngagementData[mockEngagementData.length - 1].views - mockEngagementData[mockEngagementData.length - 2].views} this month
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Engagement Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round((mockContentStats.totalLikes + mockContentStats.totalComments) / mockContentStats.totalViews * 100)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Likes + Comments / Views
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Growth Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Community Growth</CardTitle>
                  <CardDescription>
                    Member growth over time
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <LineChart className="h-12 w-12 mx-auto mb-2" />
                    <p>Growth chart visualization would appear here</p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Engagement Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Engagement Overview</CardTitle>
                  <CardDescription>
                    Views, likes, and comments over time
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <BarChart className="h-12 w-12 mx-auto mb-2" />
                    <p>Engagement chart visualization would appear here</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="members" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Member Growth</CardTitle>
                  <CardDescription>
                    New members over time
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <LineChart className="h-12 w-12 mx-auto mb-2" />
                    <p>Member growth chart visualization would appear here</p>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Member Roles</CardTitle>
                    <CardDescription>
                      Distribution of member roles
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[200px] flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <PieChart className="h-12 w-12 mx-auto mb-2" />
                      <p>Role distribution chart would appear here</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Member Activity</CardTitle>
                    <CardDescription>
                      Active vs inactive members
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[200px] flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <PieChart className="h-12 w-12 mx-auto mb-2" />
                      <p>Activity distribution chart would appear here</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="content" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Posts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{mockContentStats.totalPosts}</div>
                    <p className="text-xs text-muted-foreground">
                      {mockContentStats.publicPosts} public, {mockContentStats.privatePosts} private
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Average Views per Post
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round(mockContentStats.totalViews / mockContentStats.totalPosts)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total Views / Total Posts
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Average Engagement per Post
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round((mockContentStats.totalLikes + mockContentStats.totalComments) / mockContentStats.totalPosts)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      (Likes + Comments) / Total Posts
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Content Types</CardTitle>
                  <CardDescription>
                    Distribution of content by type
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <PieChart className="h-12 w-12 mx-auto mb-2" />
                    <p>Content type distribution chart would appear here</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Performing Content</CardTitle>
                  <CardDescription>
                    Posts with the highest engagement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Top content analysis would appear here</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="engagement" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Likes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{mockContentStats.totalLikes}</div>
                    <p className="text-xs text-green-600">
                      +{mockEngagementData[mockEngagementData.length - 1].likes - mockEngagementData[mockEngagementData.length - 2].likes} this month
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Comments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{mockContentStats.totalComments}</div>
                    <p className="text-xs text-green-600">
                      +{mockEngagementData[mockEngagementData.length - 1].comments - mockEngagementData[mockEngagementData.length - 2].comments} this month
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Engagement Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round((mockContentStats.totalLikes + mockContentStats.totalComments) / mockContentStats.totalViews * 100)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      (Likes + Comments) / Views
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Engagement Over Time</CardTitle>
                  <CardDescription>
                    Likes and comments over time
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <LineChart className="h-12 w-12 mx-auto mb-2" />
                    <p>Engagement trend chart would appear here</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Most Active Members</CardTitle>
                  <CardDescription>
                    Members with the highest engagement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Active members analysis would appear here</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
