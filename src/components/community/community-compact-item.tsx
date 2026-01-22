
import { type Community } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Tag } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export function CommunityCompactItem({ community }: { community: Community }) {
  const displayTags = community.tags?.slice(0, 3) || [];

  return (
    <Link href={`/${community.handle}`}>
      <Card className="hover:bg-accent/50 transition-colors h-full">
        <CardContent className="p-4 flex items-center gap-4">
          <Avatar className="h-12 w-12 rounded-lg flex-shrink-0">
            <AvatarImage src={community.communityProfileImage} alt={community.name} />
            <AvatarFallback>{community.name?.charAt(0) || 'C'}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-md">{community.name}</p>
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="h-4 w-4 mr-1" />
              <span>{community.memberCount || 0} members</span>
            </div>
          </div>
        </CardContent>
        {displayTags.length > 0 && (
          <div className="px-4 pb-4">
            <div className="flex flex-wrap gap-1">
              {displayTags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
            </div>
          </div>
        )}
      </Card>
    </Link>
  );
}
