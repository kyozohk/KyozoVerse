
'use client';

import React, { useState } from 'react';
import { List, LayoutGrid, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Community } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const CommunityGridItem = ({ community }: { community: Community }) => (
    <Link href={`/${community.handle}`}>
      <Card className="hover:bg-accent transition-colors h-full text-center">
        <CardContent className="p-6 flex flex-col items-center justify-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={community.communityProfileImage} alt={community.name} />
            <AvatarFallback>{community.name?.charAt(0) || 'C'}</AvatarFallback>
          </Avatar>
          <p className="font-semibold text-lg">{community.name}</p>
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <Users className="h-4 w-4 mr-1" />
            <span>{community.memberCount || 0} members</span>
          </div>
        </CardContent>
      </Card>
    </Link>
);

const CommunityListItem = ({ community }: { community: Community }) => {
    const formattedDate = community.createdAt
    ? format(new Date(community.createdAt.seconds * 1000), 'MMM dd, yyyy')
    : 'N/A';

    return (
        <Link href={`/${community.handle}`}>
            <Card className="hover:bg-accent transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-12 w-12 rounded-lg">
                    <AvatarImage src={community.communityProfileImage} alt={community.name} />
                    <AvatarFallback>{community.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold text-md">{community.name}</p>
                    <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{community.memberCount || 0} members</span>
                    </div>
                </div>
                </CardContent>
            </Card>
        </Link>
    );
};


interface CommunityListProps {
  communities: Community[];
}

export function CommunityList({ communities }: CommunityListProps) {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
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
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
            className={cn("h-9 w-9", viewMode === 'list' && "bg-primary text-primary-foreground hover:bg-primary/90")}
          >
            <List className="h-5 w-5" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
            className={cn("h-9 w-9", viewMode === 'grid' && "bg-primary text-primary-foreground hover:bg-primary/90")}
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
