"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Bell, Send, Users } from "lucide-react";
import { getUserRoleInCommunity, getCommunityByHandle } from "@/lib/community-utils";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CommunityBroadcastPage() {
  const { user } = useAuth();
  const params = useParams();
  const handle = params.handle as string;
  const { toast } = useToast();
  
  const [userRole, setUserRole] = useState<string>("guest");
  const [communityId, setCommunityId] = useState<string>("");
  const [communityName, setCommunityName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  useEffect(() => {
    async function fetchCommunityAndRole() {
      if (!handle) return;
      
      try {
        const communityData = await getCommunityByHandle(handle);
        
        if (communityData) {
          setCommunityId(communityData.communityId);
          setCommunityName(communityData.name);
          
          if (user) {
            const role = await getUserRoleInCommunity(user.uid, communityData.communityId);
            setUserRole(role);
          }
        }
      } catch (error) {
        console.error("Error fetching community data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCommunityAndRole();
  }, [handle, user]);
  
  const handleSendBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast({
        title: "Error",
        description: "Please provide both a title and message for your broadcast.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSending(true);
    
    try {
      // This would be implemented with actual broadcast functionality
      // For now, we'll just simulate success
      setTimeout(() => {
        toast({
          title: "Broadcast Sent",
          description: `Your message has been sent to all members of ${communityName}.`,
        });
        setBroadcastTitle("");
        setBroadcastMessage("");
        setIsSending(false);
      }, 1500);
    } catch (error) {
      console.error("Error sending broadcast:", error);
      toast({
        title: "Error",
        description: "Failed to send broadcast. Please try again.",
        variant: "destructive",
      });
      setIsSending(false);
    }
  };
  
  const canBroadcast = userRole === "owner" || userRole === "admin";
  
  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!canBroadcast) {
    return (
      <div className="container mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Community Broadcasts</CardTitle>
            <CardDescription>
              Stay updated with important announcements from @{handle}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 flex flex-col items-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Broadcasts Yet</h3>
              <p className="text-muted-foreground">
                There are no announcements from this community yet.
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
          <CardTitle className="text-2xl">Community Broadcasts</CardTitle>
          <CardDescription>
            Send important announcements to all members of @{handle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="new">
            <TabsList className="mb-6">
              <TabsTrigger value="new">New Broadcast</TabsTrigger>
              <TabsTrigger value="history">Broadcast History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="new" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-1">
                    Broadcast Title
                  </label>
                  <Input
                    id="title"
                    placeholder="Enter a title for your announcement"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-1">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    placeholder="Enter your announcement message..."
                    rows={6}
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                  />
                </div>
                
                <div className="flex justify-between items-center pt-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-1" />
                    <span>Will be sent to all {communityName} members</span>
                  </div>
                  
                  <Button onClick={handleSendBroadcast} disabled={isSending}>
                    <Send className="h-4 w-4 mr-2" />
                    {isSending ? "Sending..." : "Send Broadcast"}
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="history">
              <div className="text-center py-12 flex flex-col items-center">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Previous Broadcasts</h3>
                <p className="text-muted-foreground">
                  You haven't sent any broadcasts to this community yet.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
