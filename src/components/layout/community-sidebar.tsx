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
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { type Community } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { CreateCommunityDialog } from '../community/create-community-dialog';


const communityNavItems = [
    { href: (handle: string) => `/${handle}`, icon: LayoutDashboard, label: 'Overview' },
    { href: (handle: string) => `/${handle}/members`, icon: Users, label: 'Members' },
    { href: (handle: string) => `/${handle}/broadcast`, icon: Bell, label: 'Broadcast' },
    { href: (handle: string) => `/${handle}/inbox`, icon: Inbox, label: 'Inbox' },
    { href: (handle: string) => `/${handle}/feed`, icon: Rss, label: 'Feed' },
    { href: (handle: string) => `/${handle}/ticketing`, icon: Ticket, label: 'Ticketing' },
    { href: (handle: string) => `/${handle}/integrations`, icon: Plug, label: 'Integrations' },
    { href: (handle: string) => `/${handle}/analytics`, icon: BarChart, label: 'Analytics' },
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

  if (!isOwnerOfCurrentCommunity && pathname !== '/dashboard') {
      return null;
  }

  if (pathname === '/dashboard') {
      return null;
  }


  return (
    <div className="hidden border-r bg-card lg:block w-72">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            {loading ? (
                <Skeleton className="h-10 w-full" />
            ) : communities.length > 0 && selectedCommunityHandle ? (
                <Select value={selectedCommunityHandle} onValueChange={handleValueChange}>
                    <SelectTrigger className="w-full">
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
                <Button variant="outline" className="w-full" onClick={() => setIsCreateDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Community
                </Button>
            )}
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {selectedCommunityHandle && communityNavItems.map((item) => (
              <Link
                key={item.label}
                href={item.href(selectedCommunityHandle)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-4">
             <Button variant="secondary" className="w-full" onClick={() => setIsCreateDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Community
            </Button>
        </div>
      </div>
      <CreateCommunityDialog isOpen={isCreateDialogOpen} setIsOpen={setIsCreateDialogOpen} />
    </div>
  );
}
