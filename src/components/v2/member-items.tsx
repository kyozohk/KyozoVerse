import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Mail, Calendar, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RoundImage } from '@/components/ui/round-image';
import { Badge } from '@/components/ui/badge';

interface Member {
  id: string;
  userId: string;
  name: string;
  email?: string;
  imageUrl: string;
  imageHint?: string;
  role?: string;
  joinedDate?: any;
  [key: string]: any;
}

interface MemberItemProps {
  item: Member;
  isSelected: boolean;
  urlField?: string;
}

const formatDate = (date: any): string => {
  if (!date) return '';
  
  // Handle Firestore Timestamp
  if (date?.seconds) {
    return new Date(date.seconds * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
  
  // Handle regular Date or string
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const getRoleBadgeColor = (role?: string) => {
  switch (role?.toLowerCase()) {
    case 'owner':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'admin':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'member':
    default:
      return 'bg-secondary text-secondary-foreground';
  }
};

export const MemberGridItem = ({ item, isSelected }: MemberItemProps) => {
  const params = useParams();
  const handle = params?.handle as string;
  
  return (
    <Link href={`/${handle}/members/${item.userId}`}>
      <Card 
        className={cn(
          "flex h-full flex-col overflow-hidden cursor-pointer transition-all hover:bg-accent/50 hover:shadow-md",
          isSelected && "ring-2 ring-ring"
        )}
        style={{ borderColor: 'var(--page-content-border)' }}
      >
        <div className="relative" style={{ paddingTop: '60%', backgroundColor: '#E2D9C9' }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <RoundImage 
              src={item.imageUrl} 
              alt={item.name} 
              size={80}
              border={true}
            />
          </div>
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-base font-semibold line-clamp-1">{item.name}</h3>
            {item.role && (
              <Badge variant="outline" className={cn("text-xs capitalize shrink-0", getRoleBadgeColor(item.role))}>
                {item.role}
              </Badge>
            )}
          </div>
          {item.email && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{item.email}</span>
            </div>
          )}
          {item.joinedDate && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-auto pt-2">
              <Calendar className="h-3 w-3 shrink-0" />
              <span>Joined {formatDate(item.joinedDate)}</span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
};

export const MemberListItem = ({ item, isSelected }: MemberItemProps) => {
  const params = useParams();
  const handle = params?.handle as string;
  
  return (
    <Link href={`/${handle}/members/${item.userId}`}>
      <Card 
        className={cn(
          "flex items-center p-4 cursor-pointer transition-all hover:bg-accent/50 hover:shadow-md",
          isSelected && "ring-2 ring-ring bg-accent/50"
        )}
        style={{ borderColor: 'var(--page-content-border)' }}
      >
        <RoundImage 
          src={item.imageUrl} 
          alt={item.name} 
          size={56}
          border={true}
        />
        <div className="flex-1 min-w-0 ml-4">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-base font-semibold truncate">{item.name}</h3>
            {item.role && (
              <Badge variant="outline" className={cn("text-xs capitalize shrink-0", getRoleBadgeColor(item.role))}>
                {item.role}
              </Badge>
            )}
          </div>
          {item.email && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{item.email}</span>
            </div>
          )}
        </div>
        <div className="hidden sm:flex flex-col items-end text-xs text-muted-foreground ml-4">
          {item.joinedDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(item.joinedDate)}</span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
};

export const MemberCircleItem = ({ item, isSelected }: MemberItemProps) => {
  const params = useParams();
  const handle = params?.handle as string;
  
  return (
    <Link href={`/${handle}/members/${item.userId}`}>
      <Card 
        className={cn(
          "flex h-full w-full flex-col items-center justify-start text-center overflow-hidden cursor-pointer transition-all hover:bg-accent/50 hover:shadow-md",
          isSelected && "ring-2 ring-ring"
        )}
        style={{ borderColor: 'var(--page-content-border)' }}
      >
        <div className="p-6 pt-6">
          <RoundImage 
            src={item.imageUrl} 
            alt={item.name} 
            size={96}
            border={true}
          />
        </div>
        <div className="px-4 pb-4 flex-1 flex flex-col justify-between w-full">
          <div>
            <h3 className="text-base font-semibold line-clamp-1 mb-1">{item.name}</h3>
            {item.role && (
              <Badge variant="outline" className={cn("text-xs capitalize", getRoleBadgeColor(item.role))}>
                {item.role}
              </Badge>
            )}
          </div>
          {item.email && (
            <p className="text-xs text-muted-foreground truncate mt-2">{item.email}</p>
          )}
        </div>
      </Card>
    </Link>
  );
};
