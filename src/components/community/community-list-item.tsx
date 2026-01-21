
import { Community } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, Tag } from 'lucide-react';
import { format } from 'date-fns';

interface CommunityListItemProps {
  community: Community;
}

export function CommunityListItem({ community }: CommunityListItemProps) {
  return (
    <div className="flex items-center p-4 bg-card rounded-lg shadow-sm hover:bg-muted/50 transition-colors duration-200 w-full cursor-pointer">
      <Avatar className="h-12 w-12 mr-6">
        <AvatarImage src={community.logoUrl} alt={community.name} />
        <AvatarFallback>{community.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-grow grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <div className="font-semibold text-lg col-span-1">{community.name}</div>
        <div className="flex items-center text-sm text-muted-foreground col-span-1">
          <Users className="h-4 w-4 mr-2" />
          {community.memberCount || 0} members
        </div>
        <div className="flex items-center text-sm text-muted-foreground col-span-1">
          <Tag className="h-4 w-4 mr-2" />
          <div className="flex flex-wrap gap-1">
            {community.tags?.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="secondary">{tag}</Badge>
            ))}
            {community.tags && community.tags.length > 2 && (
              <Badge variant="outline">+{community.tags.length - 2}</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center text-sm text-muted-foreground col-span-1 md:justify-self-end">
          <Calendar className="h-4 w-4 mr-2" />
          Created {format(new Date(community.createdAt), 'MMM dd, yyyy')}
        </div>
      </div>
    </div>
  );
}
