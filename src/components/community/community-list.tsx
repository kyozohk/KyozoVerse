'use client';

import { useState } from 'react';
import { Input, CustomButton } from '@/components/ui';
import { LayoutGrid, List, PlusCircle, Search } from 'lucide-react';
import { Community } from '@/lib/types';
import { CommunityCard } from './community-card';
import Link from 'next/link';
import { CreateCommunityDialog } from './create-community-dialog';
import { CommunityBanner } from './community-banner';
import { Card } from '../ui/card';

type ViewMode = 'grid' | 'list';

interface CommunityListProps {
  communities: Community[];
}

export function CommunityList({ communities }: CommunityListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Filter communities based on search term
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
      
    

      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="relative flex-grow">
          <Input
            label="Search communities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setViewMode('list')}
            className={`icon-button ${viewMode === 'list' ? 'icon-button-active' : ''}`}
            aria-label="List View"
          >
            <List className="h-6 w-6" />
          </button>
          <button 
            onClick={() => setViewMode('grid')}
            className={`icon-button ${viewMode === 'grid' ? 'icon-button-active' : ''}`}
            aria-label="Grid View"
          >
            <LayoutGrid className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
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
          <Link key={community.communityId} href={`/${community.handle}`} className="block h-full">
            <CommunityCard community={community} />
          </Link>
        ))}
      </div>
      
      <CreateCommunityDialog isOpen={isCreateDialogOpen} setIsOpen={setIsCreateDialogOpen} />
    </div>
  );
}
