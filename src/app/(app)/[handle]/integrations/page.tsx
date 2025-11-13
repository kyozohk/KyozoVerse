"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plug, Plus, ExternalLink, Settings, Lock, Check, AlertTriangle } from "lucide-react";
import { getUserRoleInCommunity, getCommunityByHandle } from "@/lib/community-utils";
import Image from "next/image";

// Mock data for integrations
const mockIntegrations = [
  {
    id: "discord",
    name: "Discord",
    description: "Connect your community to a Discord server for real-time chat.",
    icon: "/discord-icon.svg", // This would need to be added to your public folder
    status: "active",
    category: "communication"
  },
  {
    id: "slack",
    name: "Slack",
    description: "Connect your community to a Slack workspace for team collaboration.",
    icon: "/slack-icon.svg", // This would need to be added to your public folder
    status: "inactive",
    category: "communication"
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    description: "Sync your community members with Mailchimp for email campaigns.",
    icon: "/mailchimp-icon.svg", // This would need to be added to your public folder
    status: "inactive",
    category: "marketing"
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Process payments and subscriptions for your community.",
    icon: "/stripe-icon.svg", // This would need to be added to your public folder
    status: "inactive",
    category: "payments"
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Connect your community to thousands of apps with automated workflows.",
    icon: "/zapier-icon.svg", // This would need to be added to your public folder
    status: "inactive",
    category: "automation"
  }
];

export default function CommunityIntegrationsPage() {
  const { user } = useAuth();
  const params = useParams();
  const handle = params.handle as string;
  
  const [userRole, setUserRole] = useState<string>("guest");
  const [communityId, setCommunityId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState(mockIntegrations);
  const [activeCategory, setActiveCategory] = useState("all");
  
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
  
  const canAccessIntegrations = userRole === "owner" || userRole === "admin";
  
  const filteredIntegrations = integrations.filter(integration => {
    return activeCategory === "all" || integration.category === activeCategory;
  });
  
  const toggleIntegration = (id: string) => {
    setIntegrations(integrations.map(integration => 
      integration.id === id 
        ? { ...integration, status: integration.status === "active" ? "inactive" : "active" } 
        : integration
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
  
  if (!canAccessIntegrations) {
    return (
      <div className="container mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Community Integrations</CardTitle>
            <CardDescription>
              Access to integrations is restricted to administrators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 flex flex-col items-center">
              <Plug className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
              <p className="text-muted-foreground">
                You don't have permission to view or manage integrations.
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
              <CardTitle className="text-2xl">Community Integrations</CardTitle>
              <CardDescription>
                Connect your community with other platforms and services
              </CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Integration
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="communication">Communication</TabsTrigger>
              <TabsTrigger value="marketing">Marketing</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="automation">Automation</TabsTrigger>
            </TabsList>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredIntegrations.map((integration) => (
                <Card key={integration.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-accent flex items-center justify-center">
                          {/* Fallback icon if image is not available */}
                          <Plug className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <CardDescription>{integration.description}</CardDescription>
                        </div>
                      </div>
                      <Badge 
                        variant={integration.status === "active" ? "default" : "outline"}
                        className={integration.status === "active" ? "bg-green-100 text-green-800 border-green-300" : ""}
                      >
                        {integration.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardFooter className="flex justify-between pt-4">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {integration.status === "active" ? "Enabled" : "Disabled"}
                      </span>
                      <Switch 
                        checked={integration.status === "active"} 
                        onCheckedChange={() => toggleIntegration(integration.id)}
                      />
                    </div>
                  </CardFooter>
                </Card>
              ))}
              
              {/* Add a "Coming Soon" card */}
              <Card className="overflow-hidden border-dashed">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md bg-accent flex items-center justify-center">
                        <Lock className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">More Integrations</CardTitle>
                        <CardDescription>Additional integrations coming soon.</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline">Coming Soon</Badge>
                  </div>
                </CardHeader>
                <CardFooter className="flex justify-between pt-4">
                  <Button variant="outline" size="sm" disabled>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Learn More
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Unavailable</span>
                    <Switch disabled />
                  </div>
                </CardFooter>
              </Card>
            </div>
            
            {filteredIntegrations.length === 0 && (
              <div className="text-center py-12 flex flex-col items-center">
                <Plug className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Integrations Found</h3>
                <p className="text-muted-foreground">
                  There are no integrations in this category yet
                </p>
              </div>
            )}
          </Tabs>
          
          <div className="mt-8 p-4 border rounded-md bg-accent/30 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium mb-1">Integration Security Note</h4>
              <p className="text-sm text-muted-foreground">
                All integrations require appropriate permissions and may have access to your community data. 
                Always review the permissions before enabling an integration.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
