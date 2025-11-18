
"use client";

import { useState, useEffect } from "react";
import { useParams, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, ListView, Skeleton } from "@/components/ui";
import { getUserRoleInCommunity, getCommunityByHandle } from "@/lib/community-utils";
import { getThemeForPath } from '@/lib/theme-utils';

export default function CommunityTicketingPage() {
  const { user } = useAuth();
  const params = useParams();
  const pathname = usePathname();
  const handle = params.handle as string;
  
  const [userRole, setUserRole] = useState<string>("guest");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { activeColor } = getThemeForPath(pathname);

  useEffect(() => {
    async function fetchCommunityAndRole() {
      if (!handle) return;
      
      try {
        const communityData = await getCommunityByHandle(handle);
        
        if (communityData && user) {
            const role = await getUserRoleInCommunity(user.uid, communityData.communityId);
            setUserRole(role);
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
  
  if (loading) {
     return (
      <div className="p-6 md:p-8">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  
  return (
    <div className="p-6 md:p-8">
       <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Ticketing</CardTitle>
          <CardDescription>
            {canAccessTicketing ? `Manage support tickets for @${handle}` : `Your tickets for @${handle}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
           <ListView
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            themeColor={activeColor}
          >
            <div className="text-center col-span-full py-12 text-muted-foreground">
              Ticketing system functionality coming soon.
            </div>
          </ListView>
        </CardContent>
      </Card>
    </div>
  );
}
