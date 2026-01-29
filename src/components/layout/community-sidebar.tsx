
'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { PlusCircle, Check } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Skeleton,
  Button
} from '@/components/ui';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { type Community } from '@/lib/types';
import { CreateCommunityDialog } from '../community/create-community-dialog';
import { SidebarNavItem } from '@/components/ui/sidebar-nav-item';
import { communityNavItems } from '@/lib/theme-utils';
import { RoundImage } from '@/components/ui/round-image';

export default function CommunitySidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommunityHandle, setSelectedCommunityHandle] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showCommunityList, setShowCommunityList] = useState(false);

  useEffect(() => {
    const pathParts = pathname.split('/');
    const handleFromPath = pathParts.length > 2 && pathParts[1] === 'v2' ? pathParts[2] : pathParts[1];

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
        const batchSize = 30; // Firestore 'in' query limit is 30
        const batches = [];
        
        for (let i = 0; i < nonOwnedMemberIds.length; i += batchSize) {
          const batch = nonOwnedMemberIds.slice(i, i + batchSize);
          // Firestore `in` query requires a non-empty array.
          if(batch.length > 0) {
            const communitiesQuery = query(collection(db, 'communities'), where('communityId', 'in', batch));
            batches.push(getDocs(communitiesQuery));
          }
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
    }, (error) => {
      console.error("Error fetching communities:", error);
      setLoading(false);
    });

    return () => unsubscribeOwned();
  }, [user, pathname]);

  const handleCommunitySelect = (handle: string) => {
    setSelectedCommunityHandle(handle);
    setShowCommunityList(false);
    const isV2 = pathname.startsWith('/v2');
    const newPath = isV2 ? `/v2/${handle}` : `/${handle}`;
    router.push(newPath);
  };

  const selectedCommunity = communities.find(c => c.handle === selectedCommunityHandle);

  return (
    <div
      className={`hidden border-r lg:block w-64 sidebar transition-all duration-200 sidebar-shadow fixed left-20 top-0 h-screen overflow-hidden z-30`}
      style={{
        backgroundColor: 'hsl(var(--sidebar-background))',
      }}
    >
      {showCommunityList && (
        <div className="absolute inset-0 z-20 flex flex-col p-2" style={{ backgroundColor: 'hsl(var(--sidebar-background))' }}>
          <div className="flex h-[80px] items-center justify-between border-b px-2">
            <h2 className="text-xl font-bold text-foreground">Communities</h2>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <PlusCircle className="h-5 w-5" />
            </Button>
          </div>

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
                      className={`w-full p-3 rounded-xl transition-all duration-200 hover:scale-[1.02] relative group border-2 ${isSelected ? 'border-primary' : 'border-transparent'}`}
                    >
                      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-accent"/>
                      
                      <div className="flex items-center gap-3 relative z-10">
                        <div className="relative flex items-center justify-center flex-shrink-0">
                          <RoundImage 
                            src={community.communityProfileImage || ''} 
                            alt={community.name}
                            size={48}
                            border={true}
                          />
                          {isSelected && (
                            <span className="absolute -top-1 -left-1 bg-background rounded-full p-0.5 z-20">
                              <Check className="h-4 w-4 text-foreground" />
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

      {!showCommunityList && (
        <div className="relative z-10 flex h-full max-h-screen flex-col p-2">
          <div className="flex h-[80px] items-center border-b">
            {loading ? (
              <Skeleton className="h-10 w-full" />
            ) : communities.length > 0 && selectedCommunityHandle ? (
              <button
                onClick={() => setShowCommunityList(true)}
                className="w-full h-full px-2 bg-transparent hover:opacity-80 transition-opacity flex items-center gap-3"
              >
                <RoundImage 
                  src={selectedCommunity?.communityProfileImage || ''} 
                  alt={selectedCommunity?.name || 'Community'}
                  size={40}
                  border={true}
                />
                <span className="font-semibold text-lg text-foreground truncate">
                  {selectedCommunity?.name}
                </span>
              </button>
            ) : (
              <div className="w-full px-2">
                <Button variant="outline" className="w-full" onClick={() => setIsCreateDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Community
                </Button>
              </div>
            )}
          </div>

          <div className="flex-1 py-2">
            <nav className="grid items-start px-2 text-sm font-medium">
              {selectedCommunityHandle && communityNavItems.map((item) => {
                const Icon = item.icon;
                const isV2 = pathname.startsWith('/v2');
                const href = isV2 ? `/v2${item.href(selectedCommunityHandle)}` : item.href(selectedCommunityHandle);

                return (
                  <SidebarNavItem
                    key={item.label}
                    href={href}
                    icon={<Icon />}
                    isActive={pathname === href}
                    className="my-1 py-3"
                  >
                    {item.label}
                  </SidebarNavItem>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      <CreateCommunityDialog isOpen={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
    </div>
  );
}
