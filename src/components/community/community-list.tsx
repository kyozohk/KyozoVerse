
'use client';

import { useState } from 'react';
import { Community } from '@/lib/types';
import { CommunityCard } from './community-card';
import { ItemsGrid } from '@/components/shared/items-grid';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { List, LayoutGrid, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

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

      <ItemsGrid
        items={filteredCommunities}
        isLoading={loading}
        renderItem={(community) => <CommunityCard community={community} />}
        gridClassName={cn(
          "grid gap-6",
          viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3" : "grid-cols-1"
        )}
      />
    </div>
  );
}
