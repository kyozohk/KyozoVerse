
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
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
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
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
  const [showCommunityList, setShowCommunityList] = useState(false);

  const { section: currentSection, activeColor, activeBgColor } = getThemeForPath(pathname);
  
  useEffect(() => {
    // Extract handle from pathname: /[handle]/... -> handle is at index 1
    const pathParts = pathname.split('/');
    const handleFromPath = pathParts[1]; // /[handle] -> get handle at index 1

    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Fetch communities where user is owner
    const ownedQuery = query(collection(db, 'communities'), where('ownerId', '==', user.uid));
    
    const unsubscribeOwned = onSnapshot(ownedQuery, async (ownedSnapshot) => {
      const ownedCommunities = ownedSnapshot.docs.map(doc => ({ communityId: doc.id, ...doc.data() } as Community));
      
      // Fetch communities where user is a member
      const memberQuery = query(collection(db, 'communityMembers'), where('userId', '==', user.uid));
      const memberSnapshot = await getDocs(memberQuery);
      const memberCommunityIds = memberSnapshot.docs.map(doc => doc.data().communityId);
      
      // Filter out owned communities
      const nonOwnedMemberIds = memberCommunityIds.filter(
        id => !ownedCommunities.find(c => c.communityId === id)
      );
      
      // Fetch community details for member communities (excluding owned ones)
      // Firestore 'in' query has a limit of 10 items, so batch the queries
      const memberCommunities: Community[] = [];
      if (nonOwnedMemberIds.length > 0) {
        const batchSize = 10;
        const batches = [];
        
        for (let i = 0; i < nonOwnedMemberIds.length; i += batchSize) {
          const batch = nonOwnedMemberIds.slice(i, i + batchSize);
          const communitiesQuery = query(collection(db, 'communities'), where('communityId', 'in', batch));
          batches.push(getDocs(communitiesQuery));
        }
        
        const batchResults = await Promise.all(batches);
        batchResults.forEach(snap => {
          snap.docs.forEach(doc => {
            memberCommunities.push({
              communityId: doc.id,
              ...doc.data(),
            } as Community);
          });
        });
      }
      
      // Combine owned and member communities
      const allCommunities = [...ownedCommunities, ...memberCommunities];
      setCommunities(allCommunities);

      const currentCommunity = allCommunities.find(c => c.handle === handleFromPath);
      if (currentCommunity) {
        setSelectedCommunityHandle(currentCommunity.handle);
      } else if (allCommunities.length > 0 && handleFromPath) {
        const communityExists = allCommunities.some(c => c.handle === handleFromPath);
        setSelectedCommunityHandle(communityExists ? handleFromPath : allCommunities[0]?.handle);
      } else {
        setSelectedCommunityHandle(null);
      }

      setLoading(false);
    }, (error) => {
      console.error("Error fetching communities:", error);
      setLoading(false);
    });

    return () => unsubscribeOwned();
  }, [user, pathname]);

  const handleCommunitySelect = (handle: string) => {
    setSelectedCommunityHandle(handle);
    setShowCommunityList(false);
    const currentSubPath = pathname.split('/').slice(2).join('/');
    const targetItem = communityNavItems.find(item => item.href(handle).endsWith(currentSubPath)) || communityNavItems[0];
    router.push(targetItem.href(handle));
  };

  const selectedCommunity = communities.find(c => c.handle === selectedCommunityHandle);

  return (
    <div
      className={`hidden border-r lg:block w-64 sidebar transition-all duration-200 sidebar-shadow relative overflow-hidden`}
      style={{
        marginLeft: mainSidebarOpen ? '0' : '0',
        borderColor: activeColor,
      }}
    >
      {/* Background with light_app_bg.png and color overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('/bg/light_app_bg.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundColor: activeBgColor,
        }}
      />

      {/* Community List View (Full Height) */}
      {showCommunityList && (
        <div className="absolute inset-0 z-20 flex flex-col" style={{ padding: '8px' }}>
          {/* Header */}
          <div className="flex h-[88px] items-center justify-between border-b px-2" style={{ borderColor: activeColor }}>
            <h2 className="text-xl font-bold text-foreground">Communities</h2>
            <CustomButton 
              variant="rounded-rect" 
              size="small"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <PlusCircle className="h-5 w-5" />
            </CustomButton>
          </div>

          {/* Communities List */}
          <div className="flex-1 overflow-y-auto py-2">
            {loading ? (
              <div className="space-y-2 px-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : (
              <div className="space-y-2 px-2">
                {communities.map((community) => {
                  const isSelected = community.handle === selectedCommunityHandle;
                  return (
                    <button
                      key={community.communityId}
                      onClick={() => handleCommunitySelect(community.handle)}
                      className="w-full p-3 rounded-xl transition-all duration-200 hover:scale-[1.02] relative group"
                      style={{
                        border: `2px solid ${isSelected ? activeColor : 'transparent'}`,
                        backgroundColor: isSelected ? activeBgColor : 'transparent',
                      }}
                    >
                      {/* Hover effect */}
                      <div 
                        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        style={{
                          backgroundColor: activeBgColor,
                          border: `2px solid ${activeColor}`,
                        }}
                      />
                      
                      <div className="flex items-center gap-3 relative z-10">
                        <div className="relative rounded-full h-14 w-14 flex items-center justify-center flex-shrink-0">
                          <div 
                            className="absolute inset-0 rounded-full"
                            style={{ backgroundColor: activeBgColor }}
                          />
                          <Avatar className="h-12 w-12 border-2 relative z-10">
                            <AvatarImage src={community.communityProfileImage} />
                            <AvatarFallback>{community.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          {isSelected && (
                            <span className="absolute -top-1 -left-1 bg-white rounded-full p-0.5 z-20">
                              <Check className="h-4 w-4 text-black" />
                            </span>
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-semibold text-base text-foreground truncate">
                            {community.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {community.memberCount} members
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation View (Default) */}
      {!showCommunityList && (
        <div className="relative z-10 flex h-full max-h-screen flex-col" style={{ padding: '0 8px' }}>
          {/* Selected Community Header (Clickable) */}
          <div className="flex h-[76px] items-center " style={{ borderColor: activeColor, padding: '0 8px' }}>
            {loading ? (
              <Skeleton className="h-10 w-full" />
            ) : communities.length > 0 && selectedCommunityHandle ? (
              <button
                onClick={() => setShowCommunityList(true)}
                className="w-full h-full p-0 bg-transparent hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-2 truncate min-h-20">
                  <div className="relative rounded-full h-16 w-16 flex items-center justify-center">
                    <div 
                      className="absolute inset-0 rounded-full"
                      style={{ backgroundColor: activeBgColor }}
                    />
                    <Avatar className="h-14 w-14 border-2 relative z-10">
                      <AvatarImage src={selectedCommunity?.communityProfileImage} />
                      <AvatarFallback>{selectedCommunity?.name?.substring(0, 2) || 'C'}</AvatarFallback>
                    </Avatar>
                  </div>
                  <span className="font-semibold text-lg text-foreground truncate">
                    {selectedCommunity?.name}
                  </span>
                </div>
              </button>
            ) : (
              <div className="w-full">
                <CustomButton variant="rounded-rect" className="w-full" onClick={() => setIsCreateDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-12 w-12" />
                  Create Community
                </CustomButton>
              </div>
            )}
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
      )}

      <CreateCommunityDialog isOpen={isCreateDialogOpen} setIsOpen={setIsCreateDialogOpen} />
    </div>
  );
}
