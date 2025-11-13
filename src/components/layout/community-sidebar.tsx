
'use client';

import React, { useState, useEffect } from 'react';
import { useSidebar } from '@/components/ui/enhanced-sidebar';
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
import { SidebarNavItem } from '@/components/ui/sidebar-nav-item';

const communityNavItems = [
    { href: (handle: string) => `/${handle}`, icon: <LayoutDashboard />, label: 'Overview', section: 'communities' },
    { href: (handle: string) => `/${handle}/members`, icon: <Users />, label: 'Members', section: 'communities' },
    { href: (handle: string) => `/${handle}/broadcast`, icon: <Bell />, label: 'Broadcast', section: 'communities' },
    { href: (handle: string) => `/${handle}/inbox`, icon: <Inbox />, label: 'Inbox', section: 'communities' },
    { href: (handle: string) => `/${handle}/feed`, icon: <Rss />, label: 'Feed', section: 'communities' },
    { href: (handle: string) => `/${handle}/ticketing`, icon: <Ticket />, label: 'Ticketing', section: 'subscription' },
    { href: (handle: string) => `/${handle}/integrations`, icon: <Plug />, label: 'Integrations', section: 'settings' },
    { href: (handle: string) => `/${handle}/analytics`, icon: <BarChart />, label: 'Analytics', section: 'analytics' },
];

const getSectionFromPath = (path: string) => {
    const handle = path.split('/')[1];
    const subRoute = path.split('/')[2];

    if (handle) {
        const communityNavItem = communityNavItems.find(item => {
            const itemPath = item.href(handle);
            return path === itemPath || (itemPath.endsWith(handle) && !subRoute) || (subRoute && itemPath.endsWith(subRoute));
        });
        if (communityNavItem) {
            return communityNavItem.section;
        }
    }
    
    // Fallback to a default section if no match
    return 'communities';
};


export default function CommunitySidebar() {
  const { user } = useAuth();
  const { open: mainSidebarOpen } = useSidebar();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommunityHandle, setSelectedCommunityHandle] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleFromPath = pathname.split('/')[1];
    
    if (!user) {
      setLoading(false);
      return;
    };

    const q = query(collection(db, 'communities'), where('ownerId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userCommunities = querySnapshot.docs.map(doc => ({ communityId: doc.id, ...doc.data() } as Community));
        setCommunities(userCommunities);

        const currentCommunity = userCommunities.find(c => c.handle === handleFromPath);
        
        if (currentCommunity) {
            setSelectedCommunityHandle(currentCommunity.handle);
        } else if (userCommunities.length > 0 && handleFromPath) {
            const communityExists = communities.some(c => c.handle === handleFromPath);
            if(communityExists) {
                setSelectedCommunityHandle(handleFromPath);
            }
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
    const currentPathEnd = pathname.split('/').slice(2).join('/');
    router.push(`/${handle}/${currentPathEnd}`);
  };

  const selectedCommunity = communities.find(c => c.handle === selectedCommunityHandle);
  
  const currentSection = getSectionFromPath(pathname);

  return (
    <div 
        className={`hidden border-r lg:block w-64 sidebar transition-all duration-200 sidebar-bg-${currentSection}`}
        style={{ 
            marginLeft: mainSidebarOpen ? '0' : '0',
        }}
    >
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-[60px] items-center border-b px-0 community-select-trigger" style={{borderColor: `var(--${currentSection}-color-border)`}}>
            {loading ? (
                <Skeleton className="h-10 w-full mx-2" />
            ) : communities.length > 0 && selectedCommunityHandle ? (
                <Select value={selectedCommunityHandle} onValueChange={handleValueChange}>
                    <SelectTrigger className="w-full h-full border-0 shadow-none focus:ring-0 bg-transparent text-card-foreground">
                        <div className="flex items-center gap-3 truncate">
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={selectedCommunity?.communityProfileImage} />
                                <AvatarFallback>{selectedCommunity?.name?.substring(0,2) || 'C'}</AvatarFallback>
                            </Avatar>
                            <SelectValue />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                    {communities.map((community) => (
                        <SelectItem key={community.communityId} value={community.handle}>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={community.communityProfileImage} />
                                <AvatarFallback>{community.name.substring(0,2)}</AvatarFallback>
                            </Avatar>
                            <span>{community.name}</span>
                        </div>
                        </SelectItem>
                    ))}
                    </SelectContent>
              </Select>
            ) : (
                <div className="px-2 w-full">
                    <CustomButton variant="rounded-rect" className="w-full" onClick={() => setIsCreateDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Community
                    </CustomButton>
                </div>
            )}
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {selectedCommunityHandle && communityNavItems.map((item) => (
              <SidebarNavItem 
                key={item.label} 
                href={item.href(selectedCommunityHandle)} 
                icon={item.icon}
                activeColor={`var(--${currentSection}-color-active)`}
              >
                {item.label}
              </SidebarNavItem>
            ))}
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
