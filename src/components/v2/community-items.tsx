import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Community {
  id: string;
  name: string;
  memberCount: number;
  imageUrl: string;
  imageHint?: string;
  tags?: string[];
}

export const CommunityGridItem = ({ item, isSelected }: { item: Community; isSelected: boolean }) => (
  <Link href={`/${item.id}`}>
    <Card 
      className={cn(
        "flex h-full flex-col overflow-hidden cursor-pointer transition-all",
        isSelected && "ring-2 ring-ring"
      )}
      style={{ borderColor: 'var(--page-content-border)' }}
    >
    <div className="relative" style={{ paddingTop: '75%' }}>
      <Image 
        src={item.imageUrl} 
        alt={item.name} 
        fill
        className="object-cover" 
        data-ai-hint={item.imageHint} 
      />
    </div>
    <div className="p-6">
      <h3 className="text-lg font-semibold">{item.name}</h3>
    </div>
    <div className="p-6 pt-0 flex-grow">
      <div className="flex items-center text-sm text-muted-foreground">
        <Users className="mr-2 h-4 w-4" />
        <span>{item.memberCount.toLocaleString()} members</span>
      </div>
    </div>
    {item.tags && item.tags.length > 0 && (
      <div className="p-6 pt-0 flex flex-wrap justify-start gap-2 pb-6">
        {item.tags.slice(0, 3).map(tag => (
          <div key={tag} className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold">
            {tag}
          </div>
        ))}
        {item.tags.length > 3 && (
          <div className="inline-flex items-center rounded-full border border-input px-2.5 py-0.5 text-xs font-semibold">
            +{item.tags.length - 3}
          </div>
        )}
      </div>
    )}
  </Card>
  </Link>
);

export const CommunityListItem = ({ item, isSelected }: { item: Community; isSelected: boolean }) => (
  <Link href={`/${item.id}`}>
    <Card 
      className={cn(
        "flex items-center p-4 cursor-pointer transition-all hover:bg-accent/50",
        isSelected && "ring-2 ring-ring bg-accent/50"
      )}
      style={{ borderColor: 'var(--page-content-border)' }}
    >
    <Image 
      src={item.imageUrl} 
      alt={item.name} 
      width={64} 
      height={64} 
      className="aspect-square rounded-md object-cover" 
      data-ai-hint={item.imageHint} 
    />
    <div className="ml-4 flex-grow">
      <h3 className="text-lg font-semibold">{item.name}</h3>
      <div className="flex items-center text-sm text-muted-foreground">
        <Users className="mr-2 h-4 w-4" />
        <span>{item.memberCount.toLocaleString()} members</span>
      </div>
    </div>
  </Card>
  </Link>
);

export const CommunityCircleItem = ({ item, isSelected }: { item: Community; isSelected: boolean }) => (
  <Link href={`/${item.id}`}>
    <Card 
      className={cn(
        "flex h-full w-full flex-col items-center justify-start text-center overflow-hidden cursor-pointer transition-all",
        isSelected && "ring-2 ring-ring"
      )}
      style={{ borderColor: 'var(--page-content-border)' }}
    >
    <div className="p-6 pt-6">
      <div className="relative flex h-28 w-28 flex-shrink-0 overflow-hidden rounded-full">
        <Image 
          src={item.imageUrl} 
          alt={item.name} 
          fill
          className="object-cover" 
          data-ai-hint={item.imageHint} 
        />
      </div>
    </div>
    <div className="p-6 pt-0 flex-grow">
      <h3 className="text-xl font-bold">{item.name}</h3>
      <div className="mt-2 flex items-center justify-center text-sm text-muted-foreground">
        <Users className="mr-2 h-4 w-4" />
        <span>{item.memberCount.toLocaleString()} members</span>
      </div>
    </div>
    {item.tags && item.tags.length > 0 && (
      <div className="p-6 pt-0 flex flex-wrap justify-center gap-2 pb-6">
        {item.tags.slice(0, 2).map(tag => (
          <div key={tag} className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold">
            {tag}
          </div>
        ))}
        {item.tags.length > 2 && (
          <div className="inline-flex items-center rounded-full border border-input px-2.5 py-0.5 text-xs font-semibold">
            +{item.tags.length - 2}
          </div>
        )}
      </div>
    )}
  </Card>
  </Link>
);
