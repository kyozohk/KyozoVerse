import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Mail, Calendar, Shield, User } from 'lucide-react';
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
  tags?: string[];
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

// Check if image URL is valid (not a placeholder)
const isValidImageUrl = (url: string) => {
  if (!url) return false;
  if (url === '/placeholder-avatar.png') return false;
  if (url.includes('placeholder')) return false;
  return true;
};

export const MemberGridItem = ({ item, isSelected }: MemberItemProps) => {
  const params = useParams();
  const handle = params?.handle as string;
  const hasValidImage = isValidImageUrl(item.imageUrl);
  
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
          {hasValidImage ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-white/50 flex items-center justify-center border-2 border-white/80">
                <User className="h-10 w-10 text-[#8A7A6A]" />
              </div>
            </div>
          )}
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
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5" style={{ backgroundColor: '#E8DFD1', color: '#5B4A3A' }}>
                  {tag}
                </Badge>
              ))}
              {item.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5" style={{ backgroundColor: '#E8DFD1', color: '#5B4A3A' }}>
                  +{item.tags.length - 3}
                </Badge>
              )}
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
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {item.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5" style={{ backgroundColor: '#E8DFD1', color: '#5B4A3A' }}>
                  {tag}
                </Badge>
              ))}
              {item.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5" style={{ backgroundColor: '#E8DFD1', color: '#5B4A3A' }}>
                  +{item.tags.length - 3}
                </Badge>
              )}
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
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1 mt-2">
              {item.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5" style={{ backgroundColor: '#E8DFD1', color: '#5B4A3A' }}>
                  {tag}
                </Badge>
              ))}
              {item.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5" style={{ backgroundColor: '#E8DFD1', color: '#5B4A3A' }}>
                  +{item.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
};
