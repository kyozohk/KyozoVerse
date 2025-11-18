
'use client';

import React, { useState, useEffect } from 'react';
import { useSidebar } from '@/components/ui/enhanced-sidebar';
import { usePathname, useRouter } from 'next/navigation';
import {
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
import { getThemeForPath, communityNavItems } from '@/lib/theme-utils';

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
    const currentSubPath = pathname.split('/').slice(2).join('/');
    const targetItem = communityNavItems.find(item => item.href(handle).endsWith(currentSubPath)) || communityNavItems[0];
    router.push(targetItem.href(handle));
  };

  const selectedCommunity = communities.find(c => c.handle === selectedCommunityHandle);
  
  const { section: currentSection, activeColor, activeBgColor } = getThemeForPath(pathname);

  return (
    <div 
        className={`hidden border-r lg:block w-64 sidebar transition-all duration-200 sidebar-bg-${currentSection} sidebar-shadow`}
        style={{ 
            marginLeft: mainSidebarOpen ? '0' : '0',
            backgroundColor: activeBgColor
        }}
    >
      <div className="flex h-full max-h-screen flex-col">
        <div className="flex h-[80px] items-center border-b px-2" style={{borderColor: `var(--${currentSection}-color-border)`}}>
            {loading ? (
                <Skeleton className="h-10 w-full" />
            ) : communities.length > 0 && selectedCommunityHandle ? (
                <Select value={selectedCommunityHandle} onValueChange={handleValueChange}>
                    <SelectTrigger className="w-full h-full border-0 shadow-none focus:ring-0 bg-transparent text-foreground p-0 community-select-trigger">
                        <div className="flex items-center gap-3 truncate">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={selectedCommunity?.communityProfileImage} />
                                <AvatarFallback>{selectedCommunity?.name?.substring(0,2) || 'C'}</AvatarFallback>
                            </Avatar>
                            <SelectValue asChild>
                                <span className="font-semibold text-lg text-foreground truncate">{selectedCommunity?.name}</span>
                            </SelectValue>
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
            ) : null}
        </div>
        <div className="flex-1 py-2">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {selectedCommunityHandle && communityNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <SidebarNavItem 
                  key={item.label} 
                  href={item.href(selectedCommunityHandle)} 
                  icon={<Icon />}
                  isActive={pathname === item.href(selectedCommunityHandle)}
                  activeColor={activeColor}
                  activeBgColor={activeBgColor}
                >
                  {item.label}
                </SidebarNavItem>
              )
            })}
          </nav>
        </div>
      </div>
      <CreateCommunityDialog isOpen={isCreateDialogOpen} setIsOpen={setIsCreateDialogOpen} />
    </div>
  );
}
