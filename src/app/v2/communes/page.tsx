'use client';

import { Plus } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { PageLayout } from '@/components/v2/page-layout';
import { PageHeader } from '@/components/v2/page-header';
import { EnhancedListView } from '@/components/v2/enhanced-list-view';
import { CommunityGridItem, CommunityListItem, CommunityCircleItem } from '@/components/v2/community-items';
import { Button } from '@/components/ui/button';

// Mock data
const mockCommunities = [
  {
    id: '1',
    name: 'Creative Coders',
    memberCount: 1250,
    imageUrl: 'https://picsum.photos/seed/comm1/400/300',
    imageHint: 'abstract design',
    tags: ['House', 'Choreography', 'Pop', 'Street', 'Dance', 'Hip Hop', 'Jazz', 'Funk', 'Soul', 'R&B'],
  },
  {
    id: '2',
    name: 'Mindful Mornings',
    memberCount: 875,
    imageUrl: 'https://picsum.photos/seed/comm2/400/300',
    imageHint: 'nature zen',
    tags: ['Wellness', 'Meditation', 'Yoga'],
  },
  {
    id: '3',
    name: 'Future Founders',
    memberCount: 2300,
    imageUrl: 'https://picsum.photos/seed/comm3/400/300',
    imageHint: 'technology circuit',
    tags: ['Startups', 'Tech', 'VC'],
  },
  {
    id: '4',
    name: 'The Book Nook',
    memberCount: 450,
    imageUrl: 'https://picsum.photos/seed/comm4/400/300',
    imageHint: 'book open',
    tags: ['Fiction', 'Sci-Fi', 'Fantasy', 'Non-Fiction'],
  },
  {
    id: '5',
    name: 'Trail Blazers',
    memberCount: 680,
    imageUrl: 'https://picsum.photos/seed/comm5/400/300',
    imageHint: 'mountain trail',
    tags: ['Hiking', 'Outdoors', 'Camping'],
  },
];

type Community = {
  id: string;
  name: string;
  memberCount: number;
  imageUrl: string;
  imageHint?: string;
  tags?: string[];
};

export default function CommunesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [communities, setCommunities] = useState<Community[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCommunities(mockCommunities);
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <PageLayout>
      <PageHeader
        title="Communities"
        description="Manage your communities or create a new one."
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Community
          </Button>
        }
      />
      <EnhancedListView
        items={communities}
        renderGridItem={(item, isSelected, onSelect) => (
          <CommunityGridItem item={item} isSelected={isSelected} />
        )}
        renderListItem={(item, isSelected, onSelect) => (
          <CommunityListItem item={item} isSelected={isSelected} />
        )}
        renderCircleItem={(item, isSelected, onSelect) => (
          <CommunityCircleItem item={item} isSelected={isSelected} />
        )}
        searchKeys={['name']}
        selectable={true}
        isLoading={isLoading}
      />
    </PageLayout>
  );
}
