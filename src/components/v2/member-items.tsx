import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RoundImage } from '@/components/ui/round-image';

interface Member {
  id: string;
  name: string;
  email?: string;
  imageUrl: string;
  imageHint?: string;
  role?: string;
  joinedDate?: string;
  [key: string]: any;
}

interface MemberItemProps {
  item: Member;
  isSelected: boolean;
  urlField?: string;
}

export const MemberGridItem = ({ item, isSelected }: MemberItemProps) => (
  <Card 
    className={cn(
      "flex h-full flex-col overflow-hidden cursor-pointer transition-all hover:bg-accent/50",
      isSelected && "ring-2 ring-ring"
    )}
    style={{ borderColor: 'var(--page-content-border)' }}
  >
    <div className="relative" style={{ paddingTop: '75%', backgroundColor: '#E2D9C9' }}>
      <div className="absolute inset-0 flex items-center justify-center">
        <RoundImage 
          src={item.imageUrl} 
          alt={item.name} 
          size={80}
          border={true}
        />
      </div>
    </div>
    <div className="p-6">
      <h3 className="text-lg font-semibold">{item.name}</h3>
      {item.role && (
        <p className="text-sm text-muted-foreground mt-1">{item.role}</p>
      )}
    </div>
  </Card>
);

export const MemberListItem = ({ item, isSelected }: MemberItemProps) => (
  <Card 
    className={cn(
      "flex items-center p-4 cursor-pointer transition-all hover:bg-accent/50",
      isSelected && "ring-2 ring-ring bg-accent/50"
    )}
    style={{ borderColor: 'var(--page-content-border)' }}
  >
    <RoundImage 
      src={item.imageUrl} 
      alt={item.name} 
      size={64}
      border={true}
      className="mr-4"
    />
    <div className="flex-1 min-w-0">
      <h3 className="text-base font-semibold truncate">{item.name}</h3>
      {item.email && (
        <p className="text-sm text-muted-foreground truncate">{item.email}</p>
      )}
      {item.role && (
        <p className="text-xs text-muted-foreground mt-1">{item.role}</p>
      )}
    </div>
  </Card>
);

export const MemberCircleItem = ({ item, isSelected }: MemberItemProps) => (
  <Card 
    className={cn(
      "flex h-full w-full flex-col items-center justify-start text-center overflow-hidden cursor-pointer transition-all hover:bg-accent/50",
      isSelected && "ring-2 ring-ring"
    )}
    style={{ borderColor: 'var(--page-content-border)' }}
  >
    <div className="p-6 pt-6">
      <RoundImage 
        src={item.imageUrl} 
        alt={item.name} 
        size={112}
        border={true}
      />
    </div>
    <div className="px-6 pb-6 flex-1 flex flex-col justify-between w-full">
      <div>
        <h3 className="text-base font-semibold line-clamp-2 mb-1">{item.name}</h3>
        {item.role && (
          <p className="text-xs text-muted-foreground">{item.role}</p>
        )}
      </div>
    </div>
  </Card>
);
