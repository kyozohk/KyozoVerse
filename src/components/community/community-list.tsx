
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Community } from '@/lib/types';
import { CommunityCard } from './community-card';
import { CreateCommunityDialog } from './create-community-dialog';
import { CommunityBanner } from './community-banner';
import { ListView } from '@/components/ui/list-view';
import { Card } from '../ui/card';

interface CommunityListProps {
  communities: Community[];
}

export function CommunityList({ communities }: CommunityListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'name' | 'tag'>('name');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const filteredCommunities = communities.filter(community => 
    community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (community.tagline && community.tagline.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <CommunityBanner 
        totalCommunities={communities.length} 
        onCreateClick={() => setIsCreateDialogOpen(true)} 
      />
      
      <ListView
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchType={searchType}
        onSearchTypeChange={setSearchType}
      >
        <Card 
            className="flex items-center justify-center border-dashed border-2 h-full min-h-[178px] cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
            onClick={() => setIsCreateDialogOpen(true)}
        >
            <div className="text-center text-muted-foreground">
                <PlusCircle className="mx-auto h-10 w-10 mb-2" />
                <span className="font-medium">Add New Community</span>
            </div>
        </Card>
        {filteredCommunities.map((community) => (
          <Link key={community.communityId} href={`/pro/${community.handle}`} className="block h-full">
            <CommunityCard community={community} />
          </Link>
        ))}
      </ListView>
      
      <CreateCommunityDialog isOpen={isCreateDialogOpen} setIsOpen={setIsCreateDialogOpen} />
    </div>
  );
}
