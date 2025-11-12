
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { CustomButton } from '@/components/ui/CustomButton';
import { LayoutGrid, List, PlusCircle, Search } from 'lucide-react';
import { Community } from '@/lib/types';
import { CommunityCard } from './community-card';
import { CommunityCardSkeleton } from './community-card-skeleton';
import Link from 'next/link';
import { Header } from '@/components/ui/header';
import { CreateCommunityDialog } from './create-community-dialog';

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
    <div>
      <div className="flex items-center justify-between mb-8">
        <Header 
          title="Communities" 
        />
        <CustomButton 
          variant="rounded-rect"
          className="flex items-center gap-2"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <PlusCircle className="h-5 w-5" />
          New Community
        </CustomButton>
      </div>

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
          <CustomButton variant="rounded-rect" onClick={() => setIsCreateDialogOpen(true)}>
            Create Community
          </CustomButton>
        </div>
      )}
      <CreateCommunityDialog isOpen={isCreateDialogOpen} setIsOpen={setIsCreateDialogOpen} />
    </div>
  );
}
