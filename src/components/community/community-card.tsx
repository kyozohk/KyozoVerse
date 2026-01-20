
import React from 'react';
import { type Community } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CommunityCardProps {
  community: Community;
}

export function CommunityCard({ community }: CommunityCardProps) {
  const router = useRouter();

  const handleCommunityClick = () => {
    router.push(`/${community.handle}`);
  };

  return (
    <Card 
        className="hover:shadow-lg transition-shadow duration-300 h-full cursor-pointer bg-card"
        onClick={handleCommunityClick}
    >
      <CardHeader className="items-center text-center">
        <Avatar className="h-20 w-20 border-4 border-background">
          <AvatarImage src={community.communityProfileImage} />
          <AvatarFallback>{community.name.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <CardTitle className="text-xl font-bold pt-4">{community.name}</CardTitle>
        <p className="text-sm text-muted-foreground">{community.memberCount} members</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {community.tags && community.tags.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {community.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
            {community.tags.length > 3 && (
              <Badge variant="outline">+{community.tags.length - 3}</Badge>
            )}
          </div>
        )}
        <div className="flex items-center justify-center text-xs text-muted-foreground pt-2">
            <CalendarIcon className="mr-1 h-4 w-4" />
            Created {community.createdAt ? format(new Date(community.createdAt.seconds * 1000), 'PP') : '-'}
        </div>
      </CardContent>
    </Card>
  );
}
