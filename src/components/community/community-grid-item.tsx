
import { type Community } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import Link from 'next/link';

export function CommunityGridItem({ community }: { community: Community }) {
  return (
    <Link href={`/${community.handle}`}>
      <Card className="hover:bg-accent transition-colors h-full text-center group">
        <CardContent className="p-6 flex flex-col items-center justify-center">
          <Avatar className="h-28 w-28 mb-4 transition-transform duration-300 group-hover:scale-110">
            <AvatarImage src={community.communityProfileImage} alt={community.name} />
            <AvatarFallback>{community.name?.charAt(0) || 'C'}</AvatarFallback>
          </Avatar>
          <p className="font-semibold text-lg">{community.name}</p>
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <Users className="h-4 w-4 mr-1" />
            <span>{community.memberCount || 0} members</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
