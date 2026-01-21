
'use client';

import React, { useState } from 'react';
import { List, LayoutGrid, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Community } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CommunityGridItem } from './community-grid-item';
import { CommunityListItem } from './community-list-item';

interface CommunityListProps {
  communities: Community[];
}

export function CommunityList({ communities }: CommunityListProps) {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative flex-grow mr-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 py-2 bg-card border border-border rounded-md text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <div className="flex items-center gap-1 rounded-md bg-secondary p-1">
          <Button
            variant={'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
            className={cn(
                "h-9 w-9 text-secondary-foreground",
                viewMode === 'list' && "bg-secondary-foreground text-secondary hover:bg-secondary-foreground/90"
            )}
          >
            <List className="h-5 w-5" />
          </Button>
          <Button
            variant={'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
            className={cn(
                "h-9 w-9 text-secondary-foreground",
                viewMode === 'grid' && "bg-secondary-foreground text-secondary hover:bg-secondary-foreground/90"
            )}
          >
            <LayoutGrid className="h-5 w-5" />
          </Button>
        </div>
      </div>
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredCommunities.map(community => <CommunityGridItem key={community.communityId} community={community} />)}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCommunities.map(community => <CommunityListItem key={community.communityId} community={community} />)}
        </div>
      )}
    </div>
  );
}
