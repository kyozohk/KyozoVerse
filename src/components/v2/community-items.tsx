import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CommunityImage } from '@/components/ui/community-image';

interface Community {
  id: string;
  name: string;
  memberCount: number;
  imageUrl: string;
  imageHint?: string;
  tags?: string[];
  handle?: string;
  [key: string]: any;
}

interface CommunityItemProps {
  item: Community;
  isSelected: boolean;
  urlField?: string;
}

export const CommunityGridItem = ({ item, isSelected, urlField = 'id' }: CommunityItemProps) => (
  <Link href={`/${item[urlField] || item.id}`}>
    <Card 
      className={cn(
        "flex h-full flex-col overflow-hidden cursor-pointer transition-all hover:bg-accent/50",
        isSelected && "ring-2 ring-ring"
      )}
      style={{ borderColor: 'var(--page-content-border)' }}
    >
    <CommunityImage 
      src={item.imageUrl} 
      alt={item.name} 
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
      containerClassName="relative" 
      containerStyle={{ paddingTop: '75%' }}
    />
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

export const CommunityListItem = ({ item, isSelected, urlField = 'id' }: CommunityItemProps) => (
  <Link href={`/${item[urlField] || item.id}`}>
    <Card 
      className={cn(
        "flex items-center p-4 cursor-pointer transition-all hover:bg-accent/50",
        isSelected && "ring-2 ring-ring bg-accent/50"
      )}
      style={{ borderColor: 'var(--page-content-border)' }}
    >
    <CommunityImage 
      src={item.imageUrl} 
      alt={item.name} 
      width={64} 
      height={64} 
      containerClassName="rounded-md overflow-hidden"
      className="aspect-square object-cover" 
    />
    <div className="ml-4 flex-grow">
      <h3 className="text-lg font-semibold">{item.name}</h3>
      <div className="flex items-center text-sm text-muted-foreground">
        <Users className="mr-2 h-4 w-4" />
        <span>{item.memberCount.toLocaleString()} members</span>
      </div>
        {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
                {item.tags.slice(0, 5).map(tag => (
                    <div key={tag} className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold">
                        {tag}
                    </div>
                ))}
                {item.tags.length > 5 && (
                    <div className="inline-flex items-center rounded-full border border-input px-2.5 py-0.5 text-xs font-semibold">
                        +{item.tags.length - 5}
                    </div>
                )}
            </div>
        )}
    </div>
  </Card>
  </Link>
);

export const CommunityCircleItem = ({ item, isSelected, urlField = 'id' }: CommunityItemProps) => (
  <Link href={`/${item[urlField] || item.id}`}>
    <Card 
      className={cn(
        "flex h-full w-full flex-col items-center justify-start text-center overflow-hidden cursor-pointer transition-all hover:bg-accent/50",
        isSelected && "ring-2 ring-ring"
      )}
      style={{ borderColor: 'var(--page-content-border)' }}
    >
    <div className="p-6 pt-6">
      <CommunityImage 
        src={item.imageUrl} 
        alt={item.name} 
        fill
        sizes="112px"
        containerClassName="relative flex h-28 w-28 flex-shrink-0 overflow-hidden rounded-full"
        className="object-cover" 
      />
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
