
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  BarChart,
  Users,
  Inbox,
  Rss,
  Ticket,
  Plug,
  LayoutDashboard,
  PlusCircle,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Avatar, 
  AvatarFallback, 
  AvatarImage, 
  Skeleton, 
  CustomButton
} from '@/components/ui';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { type Community } from '@/lib/types';
import { CreateCommunityDialog } from '../community/create-community-dialog';
import { SidebarText } from '@/components/ui/sidebar-text';

const communityNavItems = [
    { href: (handle: string) => `/${handle}`, icon: LayoutDashboard, label: 'Overview', section: 'communities' },
    { href: (handle: string) => `/${handle}/members`, icon: Users, label: 'Members', section: 'communities' },
    { href: (handle: string) => `/${handle}/broadcast`, icon: Bell, label: 'Broadcast', section: 'communities' },
    { href: (handle: string) => `/${handle}/inbox`, icon: Inbox, label: 'Inbox', section: 'communities' },
    { href: (handle: string) => `/${handle}/feed`, icon: Rss, label: 'Feed', section: 'communities' },
    { href: (handle: string) => `/${handle}/ticketing`, icon: Ticket, label: 'Ticketing', section: 'subscription' },
    { href: (handle: string) => `/${handle}/integrations`, icon: Plug, label: 'Integrations', section: 'settings' },
    { href: (handle: string) => `/${handle}/analytics`, icon: BarChart, label: 'Analytics', section: 'analytics' },
];


export default function CommunitySidebar() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnerOfCurrentCommunity, setIsOwnerOfCurrentCommunity] = useState(false);
  const [selectedCommunityHandle, setSelectedCommunityHandle] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  
  // Check if we're in a community page
  const isInCommunityPage = pathname.split('/').length > 2 && pathname.split('/')[1] !== '' && 
    !['communities', 'analytics', 'subscription', 'account', 'dashboard'].includes(pathname.split('/')[1]);


  useEffect(() => {
    const handleFromPath = pathname.split('/')[1];
    
    if (!user) {
      setLoading(false);
      setIsOwnerOfCurrentCommunity(false);
      return;
    };

    const q = query(collection(db, 'communities'), where('ownerId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userCommunities = querySnapshot.docs.map(doc => ({ communityId: doc.id, ...doc.data() } as Community));
        setCommunities(userCommunities);

        const currentCommunity = userCommunities.find(c => c.handle === handleFromPath);
        setIsOwnerOfCurrentCommunity(!!currentCommunity);
        
        if (currentCommunity) {
            setSelectedCommunityHandle(currentCommunity.handle);
        } else if (userCommunities.length > 0 && handleFromPath === 'dashboard') {
             // If on dashboard, default to the first one in the list for the dropdown
            setSelectedCommunityHandle(userCommunities[0].handle);
        } else {
            setSelectedCommunityHandle(null);
        }
        
        setLoading(false);
    }, (error) => {
        console.error("Error fetching communities:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user, pathname]);

  const handleValueChange = (handle: string) => {
    setSelectedCommunityHandle(handle);
    router.push(`/${handle}`);
  };

  const selectedCommunity = communities.find(c => c.handle === selectedCommunityHandle);
  const currentNavItem = communityNavItems.find(item => pathname === item.href(selectedCommunityHandle || ''));
  const currentSection = currentNavItem ? currentNavItem.section : 'communities';

  // Only show the sidebar when in a community page
  if (!isInCommunityPage) {
    return null;
  }

  return (
    <div className={`hidden border-r lg:flex w-64 sidebar sidebar-bg-${currentSection}`}>
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-[69px] items-center border-b px-4 lg:px-6">
            {loading ? (
                <Skeleton className="h-10 w-full" />
            ) : communities.length > 0 && selectedCommunityHandle ? (
                <Select value={selectedCommunityHandle} onValueChange={handleValueChange}>
                    <SelectTrigger className="w-full h-[41px] flex items-center">
                        <div className="flex items-center gap-3 truncate">
                             <div className="selected-community-icon-bg">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={selectedCommunity?.communityProfileImage} />
                                    <AvatarFallback>{selectedCommunity?.name?.substring(0,2) || 'C'}</AvatarFallback>
                                </Avatar>
                            </div>
                            <SidebarText><SelectValue /></SidebarText>
                        </div>
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px] overflow-y-auto">
                    {communities.map((community) => (
                        <SelectItem key={community.communityId} value={community.handle}>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={community.communityProfileImage} />
                                <AvatarFallback>{community.name.substring(0,2)}</AvatarFallback>
                            </Avatar>
                            <SidebarText>{community.name}</SidebarText>
                        </div>
                        </SelectItem>
                    ))}
                    </SelectContent>
              </Select>
            ) : (
                <CustomButton variant="rounded-rect" className="w-full" onClick={() => setIsCreateDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Community
                </CustomButton>
            )}
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-4 text-sm font-medium lg:px-6 gap-1 py-4">
            {selectedCommunityHandle && communityNavItems.map((item) => {
              const isActive = pathname === item.href(selectedCommunityHandle);
              const sectionClasses = {
                communities: {
                  active: 'border-primary text-primary',
                  hover: 'hover:text-primary'
                },
                analytics: {
                  active: 'border-analytics text-analytics',
                  hover: 'hover:text-analytics'
                },
                subscription: {
                  active: 'border-subscription text-subscription',
                  hover: 'hover:text-subscription'
                },
                settings: {
                  active: 'border-settings text-settings',
                  hover: 'hover:text-settings'
                },
              };
              // @ts-ignore
              const classes = sectionClasses[item.section] || sectionClasses.communities;
              return (
                <Link
                  key={item.label}
                  href={item.href(selectedCommunityHandle)}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-accent/50 ${isActive ? `bg-accent ${classes.active}` : ''}`}>
                  <item.icon className={`h-5 w-5 text-white group-hover:${classes.hover} ${isActive ? classes.active : ''}`} style={{ filter: 'drop-shadow(0px 0px 1px rgba(0,0,0,0.5))' }} />
                  <SidebarText>{item.label}</SidebarText>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="mt-auto p-4">
             <CustomButton variant="rounded-rect" className="w-full" onClick={() => setIsCreateDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Community
            </CustomButton>
        </div>
      </div>
      <CreateCommunityDialog isOpen={isCreateDialogOpen} setIsOpen={setIsCreateDialogOpen} />
    </div>
  );
}
