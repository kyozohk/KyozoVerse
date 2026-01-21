
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Community } from '@/lib/types';
import { CreateCommunityDialog } from './create-community-dialog';
import { CommunityBanner } from './community-banner';
import { IconListView, IconListItem } from '@/components/ui/IconListView';
import { getStorageUrl } from '@/lib/storage'; // Import the new function

interface CommunityListProps {
  communities: Community[];
}

export function CommunityList({ communities }: CommunityListProps) {
  const [viewMode, setViewMode] = useState<'icon' | 'list'>('icon');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const communityItems: IconListItem[] = communities.map(community => ({
    id: community.communityId,
    name: community.name,
    email: community.tagline || '',
    // Use the getStorageUrl function to get the full image URL
    avatarUrl: getStorageUrl(community.communityProfileImage),
    status: 'Active',
    joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    tags: community.tags || [], // The tags property does not exist on the Community type
    href: `/${community.handle}`,
  }));

  console.log('Items passed to IconListView:', communityItems);

  return (
    <div className="p-8">
      <CommunityBanner
        totalCommunities={communities.length}
        onCreateClick={() => setIsCreateDialogOpen(true)}
      />

      <IconListView
        data={communityItems}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <CreateCommunityDialog isOpen={isCreateDialogOpen} setIsOpen={setIsCreateDialogOpen} />
    </div>
  );
}
