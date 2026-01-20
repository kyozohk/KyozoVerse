
'use client';

import React, { useEffect, useState } from 'react';
import { useSidebar } from '@/components/ui/enhanced-sidebar';
import { usePathname, useRouter } from 'next/navigation';
import { PlusCircle, Check, Plus, ChevronDown } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Skeleton,
  CustomButton,
  SidebarMenu,
} from '@/components/ui';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { type Community } from '@/lib/types';
import { CreateCommunityDialog } from '../community/create-community-dialog';
import { SidebarNavItem } from '@/components/ui/sidebar-nav-item';
import { communityNavItems } from '@/lib/theme-utils';

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
  
  useEffect(() => {
    // Extract handle from pathname: /[handle]/... -> handle is at index 1
    const pathParts = pathname.split('/');
    const handleFromPath = pathParts[1]; 

    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const ownedQuery = query(collection(db, 'communities'), where('ownerId', '==', user.uid));
    
    const unsubscribeOwned = onSnapshot(ownedQuery, async (ownedSnapshot) => {
      const ownedCommunities = ownedSnapshot.docs.map(doc => ({ communityId: doc.id, ...doc.data() } as Community));
      
      const memberQuery = query(collection(db, 'communityMembers'), where('userId', '==', user.uid));
      const memberSnapshot = await getDocs(memberQuery);
      const memberCommunityIds = memberSnapshot.docs.map(doc => doc.data().communityId);
      
      const nonOwnedMemberIds = memberCommunityIds.filter(
        id => !ownedCommunities.find(c => c.communityId === id)
      );
      
      const memberCommunities: Community[] = [];
      if (nonOwnedMemberIds.length > 0) {
        const batchSize = 30;
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
      className={`hidden lg:block w-64 border-r-2 border-border bg-sidebar overflow-y-auto shadow-sm relative`}
      style={{
        marginLeft: mainSidebarOpen ? '0' : '0',
      }}
    >
      {/* Background with light_app_bg.png and color overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/bg/light_app_bg.png')`,
        }}
      />
      <div 
        className="absolute inset-0 z-0 bg-background/80 backdrop-blur-sm"
      />

      {/* Community List View (Full Height) */}
      {showCommunityList && (
        <div className="absolute inset-0 z-20 flex flex-col p-4 bg-sidebar">
          {/* Header */}
          <div className="flex h-20 items-center justify-between border-b-2 border-border px-2">
            <h2 className="text-xl font-bold text-foreground">Communities</h2>
            <CustomButton 
              variant="outline" 
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
                      className="w-full p-3 rounded-xl transition-all duration-200 hover:scale-[1.02] relative group flex items-center gap-3 text-left hover:bg-secondary"
                    >
                      <Avatar className="h-12 w-12 border-2 border-border flex-shrink-0">
                        <AvatarImage src={community.communityProfileImage} />
                        <AvatarFallback>{community.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                          <p className="font-semibold text-base text-foreground truncate">
                            {community.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {community.memberCount} members
                          </p>
                        </div>
                      {isSelected && (
                        <Check className="h-5 w-5 text-ring ml-auto" />
                      )}
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
        <div className="relative z-10 flex h-full max-h-screen flex-col">
          {/* Selected Community Header (Clickable) */}
          <div className="flex h-20 items-center border-b-2 border-border px-4">
            {loading ? (
              <Skeleton className="h-12 w-full" />
            ) : communities.length > 0 && selectedCommunityHandle ? (
              <button
                onClick={() => setShowCommunityList(true)}
                className="w-full h-full p-0 bg-transparent hover:bg-secondary/50 transition-colors rounded-lg flex items-center justify-between"
              >
                <div className="flex items-center gap-3 truncate">
                  <Avatar className="h-12 w-12 border-2 border-border flex-shrink-0">
                    <AvatarImage src={selectedCommunity?.communityProfileImage} />
                    <AvatarFallback>{selectedCommunity?.name?.substring(0, 2) || 'C'}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-lg text-foreground truncate">
                    {selectedCommunity?.name}
                  </span>
                </div>
                <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
              </button>
            ) : (
              <div className="w-full">
                <CustomButton variant="outline" className="w-full" onClick={() => setIsCreateDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Community
                </CustomButton>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <div className="flex-1 flex flex-col">
            <SidebarMenu>
              {selectedCommunityHandle && communityNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarNavItem
                    key={item.label}
                    href={item.href(selectedCommunityHandle)}
                    icon={<Icon />}
                    isActive={pathname === item.href(selectedCommunityHandle) || (item.label === 'Audience' && pathname.includes('/members'))}
                  >
                    {item.label}
                  </SidebarNavItem>
                );
              })}
            </SidebarMenu>
            {/* More Features Button */}
            <div className="mt-auto px-2 pb-1">
               <SidebarNavItem
                    href="#"
                    icon={<Plus />}
                    isActive={false}
                    className="text-muted-foreground hover:bg-transparent"
                >
                    More Features...
                </SidebarNavItem>
            </div>
          </div>
        </div>
      )}

      <CreateCommunityDialog isOpen={isCreateDialogOpen} setIsOpen={setIsCreateDialogOpen} />
    </div>
  );
}
