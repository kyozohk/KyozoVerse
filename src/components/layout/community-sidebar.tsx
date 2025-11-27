
'use client';

import React, { useEffect, useState } from 'react';
import { useSidebar } from '@/components/ui/enhanced-sidebar';
import { usePathname, useRouter } from 'next/navigation';
import { PlusCircle, Check } from 'lucide-react';
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
  const pathname = usePathname();
  const router = useRouter();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommunityHandle, setSelectedCommunityHandle] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { section: currentSection, activeColor, activeBgColor } = getThemeForPath(pathname);
  
  useEffect(() => {
    const handleFromPath = pathname.split('/')[1];

    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Fetch communities where user is owner
    const ownedQuery = query(collection(db, 'communities'), where('ownerId', '==', user.uid));
    
    // Fetch communities where user is a member
    const memberQuery = query(collection(db, 'communityMembers'), where('userId', '==', user.uid));
    
    const unsubscribeOwned = onSnapshot(ownedQuery, async (ownedSnapshot) => {
      const ownedCommunities = ownedSnapshot.docs.map(doc => ({ communityId: doc.id, ...doc.data() } as Community));
      
      // Get member communities
      const memberSnapshot = await onSnapshot(memberQuery, async (memberSnap) => {
        const memberCommunityIds = memberSnap.docs.map(doc => doc.data().communityId);
        
        // Fetch community details for member communities
        let memberCommunities: Community[] = [];
        if (memberCommunityIds.length > 0) {
          const memberCommunitiesPromises = memberCommunityIds.map(async (id) => {
            const communityDoc = await collection(db, 'communities');
            const communitySnapshot = await onSnapshot(query(communityDoc, where('__name__', '==', id)), (snap) => {
              return snap.docs.map(doc => ({ communityId: doc.id, ...doc.data() } as Community));
            });
            return new Promise<Community[]>((resolve) => {
              const unsubscribe = onSnapshot(query(collection(db, 'communities')), (snapshot) => {
                const comm = snapshot.docs.find(d => d.id === id);
                if (comm) {
                  resolve([{ communityId: comm.id, ...comm.data() } as Community]);
                } else {
                  resolve([]);
                }
                unsubscribe();
              });
            });
          });
          
          const results = await Promise.all(memberCommunitiesPromises);
          memberCommunities = results.flat();
        }
        
        // Combine and deduplicate
        const allCommunities = [...ownedCommunities, ...memberCommunities];
        const uniqueCommunities = Array.from(
          new Map(allCommunities.map(item => [item.communityId, item])).values()
        );
        
        setCommunities(uniqueCommunities);

        const currentCommunity = uniqueCommunities.find(c => c.handle === handleFromPath);
        if (currentCommunity) {
          setSelectedCommunityHandle(currentCommunity.handle);
        } else if (uniqueCommunities.length > 0 && handleFromPath) {
          const communityExists = uniqueCommunities.some(c => c.handle === handleFromPath);
          setSelectedCommunityHandle(communityExists ? handleFromPath : uniqueCommunities[0]?.handle);
        } else {
          setSelectedCommunityHandle(null);
        }

        setLoading(false);
      });
    }, (error) => {
      console.error("Error fetching communities:", error);
      setLoading(false);
    });

    return () => unsubscribeOwned();
  }, [user, pathname]);

  const handleValueChange = (handle: string) => {
    setSelectedCommunityHandle(handle);
    const currentSubPath = pathname.split('/').slice(2).join('/');
    const targetItem = communityNavItems.find(item => item.href(handle).endsWith(currentSubPath)) || communityNavItems[0];
    router.push(targetItem.href(handle));
  };

  const selectedCommunity = communities.find(c => c.handle === selectedCommunityHandle);

  return (
    <div
      className={`hidden border-r lg:block w-64 sidebar transition-all duration-200 sidebar-shadow`}
      style={{
        marginLeft: mainSidebarOpen ? '0' : '0',
        padding: '0 8px',
        backgroundColor: activeBgColor,
        borderColor: activeColor,
      }}
    >
      <div className="flex h-full max-h-screen flex-col">
        {/* Header: Dropdown or Create Community Button */}
        <div className="flex h-[88px] items-center border-b" style={{ borderColor: activeColor }}>
          {loading ? (
            <Skeleton className="h-10 w-full" />
          ) : (communities.length > 0 && selectedCommunityHandle ? (
            <Select value={selectedCommunityHandle} onValueChange={handleValueChange}>
              {/* DROPDOWN CONTROL */}
              <SelectTrigger
                className="w-full h-full shadow-none focus:ring-0 bg-transparent text-foreground p-0 border-0"
                style={{
                  borderRadius: '12px',
                  boxShadow: 'none',
                  background: 'transparent',
                }}
              >
                <div className="flex items-center gap-3 truncate min-h-20">
                  <div className="relative rounded-full h-16 w-16 flex items-center justify-center">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={selectedCommunity?.communityProfileImage} />
                      <AvatarFallback>{selectedCommunity?.name?.substring(0, 2) || 'C'}</AvatarFallback>
                    </Avatar>
                  </div>
                  <SelectValue asChild>
                    <span className="font-semibold text-lg text-foreground truncate">
                      {selectedCommunity?.name}
                    </span>
                  </SelectValue>
                </div>
              </SelectTrigger>
              {/* DROPDOWN CONTENT */}
              <SelectContent
                className="max-h-[800px] p-0"
                style={{
                  border: `2px solid ${activeColor}`,
                  borderRadius: '12px',
                  boxShadow: 'none',
                  padding: 0,
                  background: activeBgColor,
                }}
              >
                {communities.map((community) => {
                  const isSelected = community.handle === selectedCommunityHandle;
                  return (
                    <SelectItem
                      key={community.communityId}
                      value={community.handle}
                      className="py-3 px-2 h-20 w-full"
                      style={{
                        borderRadius: '12px',
                        border: `2px solid ${isSelected ? activeColor : 'transparent'}`,
                        marginBottom: 8,
                      }}
                    >
                      <div className="flex items-center gap-3 w-full relative min-h-20">
                        <div className="relative rounded-full h-16 w-16 flex items-center justify-center">
                          <Avatar className="h-14 w-14">
                            <AvatarImage src={community.communityProfileImage} />
                            <AvatarFallback>{community.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          {isSelected && (
                            <span className="absolute top-1 left-1 bg-white rounded-full p-0.5">
                              <Check className="h-5 w-5 text-black" />
                            </span>
                          )}
                        </div>
                        <span className="truncate font-semibold text-lg text-foreground flex-grow">
                          {community.name}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          ) : (
            <div className="w-full">
              <CustomButton variant="rounded-rect" className="w-full" onClick={() => setIsCreateDialogOpen(true)}>
                <PlusCircle className="mr-2 h-12 w-12" />
                Create Community
              </CustomButton>
            </div>
          ))}
        </div>
        {/* Navigation Items */}
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
                  className="my-1"
                >
                  {item.label}
                </SidebarNavItem>
              );
            })}
          </nav>
        </div>
      </div>
      <CreateCommunityDialog isOpen={isCreateDialogOpen} setIsOpen={setIsCreateDialogOpen} />
    </div>
  );
}
