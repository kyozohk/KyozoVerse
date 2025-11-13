"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Ticket, Plus, Search, Filter, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { getUserRoleInCommunity, getCommunityByHandle } from "@/lib/community-utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock data for tickets
const mockTickets = [
  {
    id: "T-1001",
    title: "Unable to access premium content",
    status: "open",
    priority: "high",
    createdBy: "Alex Johnson",
    createdAt: "2023-11-10T14:30:00",
    lastUpdated: "2023-11-10T16:45:00",
    category: "access",
    description: "I've paid for premium membership but can't access the exclusive content section."
  },
  {
    id: "T-1002",
    title: "Question about upcoming event",
    status: "in-progress",
    priority: "medium",
    createdBy: "Sam Wilson",
    createdAt: "2023-11-09T09:15:00",
    lastUpdated: "2023-11-10T11:20:00",
    category: "events",
    description: "I'd like to know more details about the upcoming virtual meetup."
  },
  {
    id: "T-1003",
    title: "Feature request: Dark mode",
    status: "closed",
    priority: "low",
    createdBy: "Taylor Swift",
    createdAt: "2023-11-05T16:45:00",
    lastUpdated: "2023-11-08T10:30:00",
    category: "feature",
    description: "It would be great to have a dark mode option for the community platform."
  }
];

export default function CommunityTicketingPage() {
  const { user } = useAuth();
  const params = useParams();
  const handle = params.handle as string;
  
  const [userRole, setUserRole] = useState<string>("guest");
  const [communityId, setCommunityId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState(mockTickets);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  
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
  
  const canAccessTicketing = userRole === "owner" || userRole === "admin";
  
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.id.toLowerCase().includes(searchQuery.toLowerCase());
                         
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Open</Badge>;
      case "in-progress":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">In Progress</Badge>;
      case "closed":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">High</Badge>;
      case "medium":
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">Medium</Badge>;
      case "low":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
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
  
  if (!canAccessTicketing) {
    return (
      <div className="container mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Community Ticketing</CardTitle>
            <CardDescription>
              Access to the ticketing system is restricted to administrators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 flex flex-col items-center">
              <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
              <p className="text-muted-foreground">
                You don't have permission to view the ticketing system.
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
              <CardTitle className="text-2xl">Community Ticketing</CardTitle>
              <CardDescription>
                Manage support tickets and inquiries for @{handle}
              </CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all-tickets">
            <TabsList className="mb-6">
              <TabsTrigger value="all-tickets">All Tickets</TabsTrigger>
              <TabsTrigger value="my-tickets">My Tickets</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all-tickets" className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tickets..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {filteredTickets.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <div className="grid grid-cols-12 gap-4 p-3 bg-muted text-sm font-medium">
                    <div className="col-span-1">ID</div>
                    <div className="col-span-4">Title</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Priority</div>
                    <div className="col-span-3">Last Updated</div>
                  </div>
                  
                  <div className="divide-y">
                    {filteredTickets.map((ticket) => (
                      <div 
                        key={ticket.id} 
                        className="grid grid-cols-12 gap-4 p-3 hover:bg-accent/50 cursor-pointer"
                        onClick={() => setSelectedTicket(ticket.id === selectedTicket ? null : ticket.id)}
                      >
                        <div className="col-span-1 text-sm">{ticket.id}</div>
                        <div className="col-span-4 font-medium">{ticket.title}</div>
                        <div className="col-span-2">{getStatusBadge(ticket.status)}</div>
                        <div className="col-span-2">{getPriorityBadge(ticket.priority)}</div>
                        <div className="col-span-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(ticket.lastUpdated).toLocaleDateString()}
                          </div>
                        </div>
                        
                        {selectedTicket === ticket.id && (
                          <div className="col-span-12 bg-accent/30 p-3 rounded-md mt-2">
                            <div className="flex justify-between mb-2">
                              <span className="text-sm font-medium">Created by: {ticket.createdBy}</span>
                              <span className="text-sm text-muted-foreground">
                                Created: {new Date(ticket.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm mb-4">{ticket.description}</p>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm">
                                <AlertCircle className="h-4 w-4 mr-2" />
                                Update Status
                              </Button>
                              <Button size="sm">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Respond
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 flex flex-col items-center">
                  <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Tickets Found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || statusFilter !== "all" 
                      ? "No tickets match your search criteria" 
                      : "There are no tickets in the system yet"}
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="my-tickets">
              <div className="text-center py-12 flex flex-col items-center">
                <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Assigned Tickets</h3>
                <p className="text-muted-foreground">
                  You don't have any tickets assigned to you
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="reports">
              <div className="text-center py-12 flex flex-col items-center">
                <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Reports Coming Soon</h3>
                <p className="text-muted-foreground">
                  Ticket analytics and reporting features will be available soon
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
