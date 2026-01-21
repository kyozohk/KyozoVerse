
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Community } from '@/lib/types';
import { CommunityCard } from './community-card';
import { CommunityListItem } from './community-list-item'; // Make sure this is imported
import { ItemsGrid } from '@/components/shared/items-grid';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { List, LayoutGrid, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface CommunityListProps {
  communities: Community[];
  loading: boolean;
}

export function CommunityList({ communities, loading }: CommunityListProps) {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (community.tagline && community.tagline.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-background p-2 rounded-md shadow-sm">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-transparent border-0 focus-visible:ring-0"
          />
        </div>
        <div className="flex items-center gap-1 rounded-md bg-muted p-1">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
            className="h-8 w-8"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
            className="h-8 w-8"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <ItemsGrid
          items={filteredCommunities}
          isLoading={loading}
          renderItem={(community) => (
            <Link href={`/${community.handle}`} className="h-full block">
              <CommunityCard community={community} />
            </Link>
          )}
          gridClassName="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
        />
      ) : (
        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)
          ) : (
            filteredCommunities.map((community) => (
              <Link key={community.communityId} href={`/${community.handle}`} className="block">
                <CommunityListItem community={community} />
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
