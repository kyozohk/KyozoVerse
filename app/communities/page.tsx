'use client';

import { Plus, Loader2, Zap, ChevronRight } from 'lucide-react';
import React, { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/v2/page-layout';
import { PageHeader } from '@/components/v2/page-header';
import { EnhancedListView } from '@/components/v2/enhanced-list-view';
import { CommunityGridItem, CommunityListItem, CommunityCircleItem } from '@/components/v2/community-items';
import { Button } from '@/components/ui/button';
import { CreateCommunityDialog } from '@/components/community/create-community-dialog';
import { AutoIntegrateWizard } from '@/components/community/auto-integrate-wizard';
import { collection, query, where, getDocs, getCountFromServer } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { usePlatformRole } from '@/hooks/use-platform-role';
import { Community } from '@/lib/types';

type CommunityWithId = Community & { id: string };

function CommunitiesContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [communities, setCommunities] = useState<CommunityWithId[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  // Reversed onboarding flow: import contacts → tag → create community.
  const [isImportOpen, setIsImportOpen] = useState(false);
  const { user } = useAuth();
  const { role: platformRole, permissions } = usePlatformRole();
  const router = useRouter();
  // Ensures the brand-new-user auto-open only fires once per mount.
  const autoOpenedRef = useRef(false);

  const fetchCommunities = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const communitiesRef = collection(db, 'communities');
      const ownedCommunitiesQuery = query(communitiesRef, where('ownerId', '==', user.uid));
      
      const ownedSnapshot = await getDocs(ownedCommunitiesQuery);
      const ownedCommunities = ownedSnapshot.docs.map(doc => ({
        communityId: doc.id,
        id: doc.id,
        ...doc.data(),
      } as CommunityWithId));

      // community_creator only sees their own communities — skip the admin-member lookup
      if (platformRole === 'community_creator') {
        const withCounts = await Promise.all(ownedCommunities.map(async (community) => {
          try {
            const countSnap = await getCountFromServer(query(collection(db, 'communityMembers'), where('communityId', '==', community.communityId)));
            return { ...community, memberCount: countSnap.data().count };
          } catch { return { ...community, memberCount: community.memberCount || 0 }; }
        }));
        setCommunities(withCounts);
        return;
      }

      // Only include communities where user is admin — NOT plain members
      const membersRef = collection(db, 'communityMembers');
      const memberQuery = query(membersRef, where('userId', '==', user.uid), where('role', 'in', ['admin', 'owner']));
      
      const memberSnapshot = await getDocs(memberQuery);
      const memberCommunityIds = memberSnapshot.docs.map(doc => doc.data().communityId);
      
      const nonOwnedMemberIds = memberCommunityIds.filter(
        id => !ownedCommunities.find(c => c.communityId === id)
      );
      
      const memberCommunities: CommunityWithId[] = [];
      if (nonOwnedMemberIds.length > 0) {
        const batchSize = 30;
        const batches = [];
        
        for (let i = 0; i < nonOwnedMemberIds.length; i += batchSize) {
          const batch = nonOwnedMemberIds.slice(i, i + batchSize);
          if (batch.length > 0) {
            const communitiesQuery = query(collection(db, 'communities'), where('communityId', 'in', batch));
            batches.push(getDocs(communitiesQuery));
          }
        }
        
        const batchResults = await Promise.all(batches);
        batchResults.forEach(snap => {
          snap.docs.forEach(doc => {
            memberCommunities.push({
              communityId: doc.id,
              id: doc.id,
              ...doc.data(),
            } as CommunityWithId);
          });
        });
      }
      
      const allCommunities = [...ownedCommunities, ...memberCommunities];
      const uniqueCommunities = Array.from(
        new Map(allCommunities.map(item => [item.communityId, item])).values()
      );
      
      // Fetch real-time member counts for each community
      const communitiesWithCounts = await Promise.all(
        uniqueCommunities.map(async (community) => {
          try {
            const memberCountQuery = query(
              collection(db, 'communityMembers'),
              where('communityId', '==', community.communityId)
            );
            const countSnapshot = await getCountFromServer(memberCountQuery);
            return {
              ...community,
              memberCount: countSnapshot.data().count,
            };
          } catch (error) {
            console.error(`Error fetching member count for ${community.communityId}:`, error);
            return {
              ...community,
              memberCount: community.memberCount || 0,
            };
          }
        })
      );
      
      setCommunities(communitiesWithCounts);
    } catch (error) {
      console.error("Error fetching communities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, platformRole]);

  // New-user onboarding: a creator/owner with zero communities is guided
  // straight into the reversed flow — auto-open the import dialog (once), which
  // imports + tags contacts and creates their first community at the end.
  useEffect(() => {
    if (
      !isLoading &&
      communities.length === 0 &&
      permissions?.canCreateCommunity &&
      !autoOpenedRef.current
    ) {
      autoOpenedRef.current = true;
      setIsImportOpen(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, communities.length, permissions]);

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-input bg-card p-6 animate-pulse">
          <div className="aspect-[4/3] bg-muted rounded-md mb-4" />
          <div className="h-5 bg-muted rounded w-3/4 mb-2" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      ))}
    </div>
  );

  return (
    <PageLayout>
      <PageHeader
        title="Communities"
        description="Manage your communities or create a new one."
        actions={
          permissions?.canCreateCommunity ? (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Community
            </Button>
          ) : undefined
        }
      />

      {/* Automatically Integrate banner — reversed flow: import + tag contacts
          first, then create the community from them. Aligned with the page
          header's horizontal padding. */}
      {permissions?.canCreateCommunity && (
        <div className="px-6 md:px-8 -mt-2 mb-2">
          <button
            onClick={() => setIsImportOpen(true)}
            className="w-full flex items-center gap-4 px-6 py-5 rounded-xl text-left transition-all hover:opacity-95 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-400/60"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)' }}
          >
            <div className="w-11 h-11 rounded-lg bg-white/20 flex-shrink-0 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-base leading-tight">Automatically Integrate</p>
              <p className="text-white/80 text-sm mt-1 leading-snug">
                Import contacts, tag them, then spin up a community from them
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-white/80 flex-shrink-0" />
          </button>
        </div>
      )}

      <EnhancedListView
        items={communities.map(c => {
          const mappedItem = {
            id: c.communityId,
            handle: c.handle,
            name: c.name,
            memberCount: c.memberCount || 0,
            imageUrl: c.communityProfileImage || '',
            imageHint: c.name,
            tags: Array.isArray((c as any).tags) ? (c as any).tags : [],
          };
          console.log('Community item:', {
            name: c.name,
            handle: c.handle,
            tags: mappedItem.tags,
            rawCommunity: c
          });
          return mappedItem;
        })}
        renderGridItem={(item, isSelected, onSelect, urlField) => (
          <CommunityGridItem item={item} isSelected={isSelected} urlField={urlField} />
        )}
        renderListItem={(item, isSelected, onSelect, urlField) => (
          <CommunityListItem item={item} isSelected={isSelected} urlField={urlField} />
        )}
        renderCircleItem={(item, isSelected, onSelect, urlField) => (
          <CommunityCircleItem item={item} isSelected={isSelected} urlField={urlField} />
        )}
        searchKeys={['name']}
        selectable={false}
        isLoading={isLoading}
        loadingComponent={<LoadingSkeleton />}
        urlField="handle"
      />
      <CreateCommunityDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCommunityUpdated={() => {
          if (user) fetchCommunities();
        }}
      />

      {/* Reversed onboarding wizard (contacts → tag → communities + subdomains).
          Full-screen step flow built on the reusable <ProcessFlow>. */}
      <AutoIntegrateWizard
        isOpen={isImportOpen}
        onClose={() => {
          setIsImportOpen(false);
          if (user) fetchCommunities();
        }}
        onComplete={(handle) => router.push(`/${handle}/audience`)}
      />
    </PageLayout>
  );
}

export default function CommunitiesPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <CommunitiesContent />
    </Suspense>
  );
}
