
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
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
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
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchCommunities = async () => {
      try {
        const ownedCommunitiesQuery = query(
          collection(db, 'communities'),
          where('ownerId', '==', user.uid)
        );
        
        const memberCommunitiesQuery = query(
          collection(db, 'communityMembers'),
          where('userId', '==', user.uid)
        );
        
        const [ownedSnapshot, memberSnapshot] = await Promise.all([
          getDocs(ownedCommunitiesQuery),
          getDocs(memberCommunitiesQuery)
        ]);

        const ownedCommunities = ownedSnapshot.docs.map(doc => ({ communityId: doc.id, ...doc.data() } as Community));
        
        const memberCommunityIds = memberSnapshot.docs.map(doc => doc.data().communityId);
        let memberCommunities: Community[] = [];
        
        if(memberCommunityIds.length > 0) {
            const communitiesQuery = query(collection(db, 'communities'), where('__name__', 'in', memberCommunityIds));
            const communitiesSnapshot = await getDocs(communitiesQuery);
            memberCommunities = communitiesSnapshot.docs.map(doc => ({ communityId: doc.id, ...doc.data() } as Community));
        }

        const allCommunities = [...ownedCommunities, ...memberCommunities];
        const uniqueCommunities = Array.from(new Map(allCommunities.map(item => [item.communityId, item])).values());
        
        setCommunities(uniqueCommunities);

        const handleFromPath = pathname.split('/')[1];
        const currentCommunity = uniqueCommunities.find(c => c.handle === handleFromPath);
        
        if (currentCommunity) {
            setSelectedCommunityHandle(currentCommunity.handle);
        } else if (uniqueCommunities.length > 0) {
            setSelectedCommunityHandle(uniqueCommunities[0].handle);
        } else {
            setSelectedCommunityHandle(null);
        }
      } catch (error) {
          console.error("Error fetching communities:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCommunities();
  }, [user, pathname]);

  const handleValueChange = (handle: string) => {
    setSelectedCommunityHandle(handle);
    router.push(`/${handle}`);
  };

  const selectedCommunity = communities.find(c => c.handle === selectedCommunityHandle);
  
  const { activeColor, activeBgColor } = getThemeForPath(pathname);

  return (
    <div 
        className={`hidden border-r lg:block w-64 sidebar transition-all duration-200 sidebar-shadow`}
        style={{ 
            marginLeft: mainSidebarOpen ? '0' : '0',
            backgroundColor: 'var(--sidebar-active-bg)',
            borderColor: 'transparent',
            '--sidebar-active-border': activeColor,
            '--sidebar-active-bg': activeBgColor,
        } as React.CSSProperties}
    >
      <div className="flex h-full max-h-screen flex-col">
        <div className="flex h-[80px] items-center px-2">
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
                    <SelectContent 
                        className="w-64"
                        useSidebarTheme={true}
                        style={{
                            '--sidebar-active-border': activeColor,
                            '--sidebar-active-bg': activeBgColor,
                        } as React.CSSProperties}
                    >
                      <div className="h-screen w-full">
                        {communities.map((community) => (
                            <SelectItem 
                                key={community.communityId} 
                                value={community.handle}
                                className="h-[80px] border-b px-2"
                                style={{'--sidebar-active-border': activeColor} as React.CSSProperties}
                            >
                                <div className="flex items-center gap-3 truncate">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={community.communityProfileImage} />
                                        <AvatarFallback>{community.name.substring(0,2)}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-semibold text-lg text-foreground truncate">{community.name}</span>
                                </div>
                            </SelectItem>
                        ))}
                      </div>
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
