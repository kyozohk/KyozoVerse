
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Community } from '@/lib/types';
import { CommunityCard } from './community-card';
import { CreateCommunityDialog } from './create-community-dialog';
import { CommunityBanner } from './community-banner';
import { ListView } from '@/components/ui/list-view';

interface CommunityListProps {
  communities: Community[];
}

export function CommunityList({ communities }: CommunityListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const filteredCommunities = communities.filter(community => 
    community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (community.tagline && community.tagline.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-8">
      <CommunityBanner 
        totalCommunities={communities.length} 
        onCreateClick={() => setIsCreateDialogOpen(true)} 
      />
      
      <ListView
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onAddAction={undefined}
      >
        {filteredCommunities.map((community) => (
          <Link key={community.communityId} href={`/communities/${community.handle}`} className="block h-full">
            <CommunityCard community={community} />
          </Link>
        ))}
      </ListView>
      
      <CreateCommunityDialog isOpen={isCreateDialogOpen} setIsOpen={setIsCreateDialogOpen} />
    </div>
  );
}
