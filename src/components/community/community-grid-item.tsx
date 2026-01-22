
import { type Community } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Tag } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export function CommunityGridItem({ community }: { community: Community }) {
  const displayTags = community.tags?.slice(0, 3) || [];
  const remainingTags = community.tags?.length ? community.tags.length - displayTags.length : 0;
  return (
    <Link href={`/${community.handle}`}>
      <Card className="hover:bg-accent/50 transition-colors h-full text-center group">
        <CardContent className="p-6 flex flex-col items-center justify-center">
          <Avatar className="h-28 w-28 mb-4 transition-transform duration-300 group-hover:scale-110 rounded-full">
            <AvatarImage src={community.communityProfileImage} alt={community.name} />
            <AvatarFallback>{community.name?.charAt(0) || 'C'}</AvatarFallback>
          </Avatar>
          <p className="font-semibold text-lg">{community.name}</p>
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <Users className="h-4 w-4 mr-1" />
            <span>{community.memberCount || 0} members</span>
          </div>
          {displayTags.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="flex flex-wrap justify-center gap-1">
                  {displayTags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                  {remainingTags > 0 && <Badge variant="outline">+{remainingTags}</Badge>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
