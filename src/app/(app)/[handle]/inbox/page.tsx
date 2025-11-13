"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Inbox, Search, Mail, Star, Archive, Trash2, MessageSquare } from "lucide-react";
import { getUserRoleInCommunity, getCommunityByHandle } from "@/lib/community-utils";

// Mock data for inbox messages
const mockMessages = [
  {
    id: "1",
    sender: {
      name: "Alex Johnson",
      avatar: "",
      email: "alex@example.com"
    },
    subject: "Question about membership",
    preview: "Hello, I was wondering if there are any special requirements to join the community...",
    date: "2023-11-10T14:30:00",
    read: false,
    starred: true
  },
  {
    id: "2",
    sender: {
      name: "Sam Wilson",
      avatar: "",
      email: "sam@example.com"
    },
    subject: "Content suggestion",
    preview: "I have some ideas for content that might be interesting for the community...",
    date: "2023-11-09T09:15:00",
    read: true,
    starred: false
  },
  {
    id: "3",
    sender: {
      name: "Taylor Swift",
      avatar: "",
      email: "taylor@example.com"
    },
    subject: "Technical issue with the platform",
    preview: "I'm experiencing some issues with accessing certain features of the community...",
    date: "2023-11-08T16:45:00",
    read: true,
    starred: false
  }
];

export default function CommunityInboxPage() {
  const { user } = useAuth();
  const params = useParams();
  const handle = params.handle as string;
  
  const [userRole, setUserRole] = useState<string>("guest");
  const [communityId, setCommunityId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState(mockMessages);
  const [selectedFolder, setSelectedFolder] = useState("inbox");
  
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
      } finally {
        setLoading(false);
      }
    }
    
    fetchCommunityAndRole();
  }, [handle, user]);
  
  const canAccessInbox = userRole === "owner" || userRole === "admin";
  
  const filteredMessages = messages.filter(message => {
    const senderName = message.sender.name.toLowerCase();
    const senderEmail = message.sender.email.toLowerCase();
    const subject = message.subject.toLowerCase();
    const preview = message.preview.toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return senderName.includes(query) || 
           senderEmail.includes(query) || 
           subject.includes(query) || 
           preview.includes(query);
  });
  
  const handleStarMessage = (id: string) => {
    setMessages(messages.map(message => 
      message.id === id ? { ...message, starred: !message.starred } : message
    ));
  };
  
  const handleMarkAsRead = (id: string) => {
    setMessages(messages.map(message => 
      message.id === id ? { ...message, read: true } : message
    ));
  };
  
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
  
  if (!canAccessInbox) {
    return (
      <div className="container mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Community Inbox</CardTitle>
            <CardDescription>
              Access to the community inbox is restricted to administrators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 flex flex-col items-center">
              <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
              <p className="text-muted-foreground">
                You don't have permission to view the community inbox.
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
          <CardTitle className="text-2xl">Community Inbox</CardTitle>
          <CardDescription>
            Manage messages and inquiries for @{handle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-12 gap-4">
            {/* Sidebar */}
            <div className="col-span-12 md:col-span-3 space-y-2">
              <Button 
                variant={selectedFolder === "inbox" ? "default" : "ghost"} 
                className="w-full justify-start" 
                onClick={() => setSelectedFolder("inbox")}
              >
                <Inbox className="h-4 w-4 mr-2" />
                Inbox
                <span className="ml-auto bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                  {messages.filter(m => !m.read).length}
                </span>
              </Button>
              
              <Button 
                variant={selectedFolder === "starred" ? "default" : "ghost"} 
                className="w-full justify-start" 
                onClick={() => setSelectedFolder("starred")}
              >
                <Star className="h-4 w-4 mr-2" />
                Starred
              </Button>
              
              <Button 
                variant={selectedFolder === "archived" ? "default" : "ghost"} 
                className="w-full justify-start" 
                onClick={() => setSelectedFolder("archived")}
              >
                <Archive className="h-4 w-4 mr-2" />
                Archived
              </Button>
              
              <Button 
                variant={selectedFolder === "trash" ? "default" : "ghost"} 
                className="w-full justify-start" 
                onClick={() => setSelectedFolder("trash")}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Trash
              </Button>
            </div>
            
            {/* Message List */}
            <div className="col-span-12 md:col-span-9 border rounded-md">
              <div className="p-3 border-b">
                <div className="flex items-center relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search messages..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="divide-y">
                {filteredMessages.length > 0 ? (
                  filteredMessages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`p-3 hover:bg-accent/50 cursor-pointer ${!message.read ? 'bg-accent/20' : ''}`}
                      onClick={() => handleMarkAsRead(message.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.sender.avatar} />
                          <AvatarFallback>{message.sender.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`font-medium truncate ${!message.read ? 'font-semibold' : ''}`}>
                              {message.sender.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(message.date).toLocaleDateString()}
                            </p>
                          </div>
                          
                          <p className={`text-sm truncate ${!message.read ? 'font-semibold' : ''}`}>
                            {message.subject}
                          </p>
                          
                          <p className="text-xs text-muted-foreground truncate">
                            {message.preview}
                          </p>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStarMessage(message.id);
                          }}
                        >
                          <Star className={`h-4 w-4 ${message.starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 flex flex-col items-center">
                    <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Messages</h3>
                    <p className="text-muted-foreground">
                      {searchQuery ? "No messages match your search" : "Your inbox is empty"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
