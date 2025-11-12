'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { CustomButton } from '@/components/ui/CustomButton';
import { LayoutGrid, List, Search } from 'lucide-react';
import { Community } from '@/lib/types';
import { CommunityCard } from './community-card';
import { CommunityCardSkeleton } from './community-card-skeleton';
import Link from 'next/link';

type ViewMode = 'grid' | 'list';

interface CommunityListProps {
  communities: Community[];
}

export function CommunityList({ communities }: CommunityListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter communities based on search term
  const filteredCommunities = communities.filter(community => 
    community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (community.description && community.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            label="Search"
            placeholder="Search communities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <CustomButton 
            variant={viewMode === 'list' ? 'primary' : 'default'} 
            onClick={() => setViewMode('list')}
            className="h-9 w-9 p-0"
          >
            <List className="h-4 w-4" />
            <span className="sr-only">List View</span>
          </CustomButton>
          <CustomButton 
            variant={viewMode === 'grid' ? 'primary' : 'default'} 
            onClick={() => setViewMode('grid')}
            className="h-9 w-9 p-0"
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="sr-only">Grid View</span>
          </CustomButton>
        </div>
      </div>

      {filteredCommunities.length > 0 ? (
        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {filteredCommunities.map((community) => (
            <Link key={community.communityId} href={`/${community.handle}`} className="block h-full">
              <CommunityCard community={community} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-card rounded-lg border">
          <h3 className="text-lg font-medium mb-2">No communities found</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm ? 'Try a different search term or create a new community.' : 'Create your first community to get started.'}
          </p>
          <CustomButton onClick={() => {}}>
            Create Community
          </CustomButton>
        </div>
      )}
    </div>
  );
}
