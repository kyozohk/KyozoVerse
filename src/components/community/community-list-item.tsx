
import { type Community } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Tag, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { format } from 'date-fns';

export function CommunityListItem({ community }: { community: Community }) {
  const displayTags = community.tags?.slice(0, 3) || [];
  const remainingTags = community.tags?.length ? community.tags.length - displayTags.length : 0;
  return (
    <Card className="hover:shadow-lg hover:bg-muted transition-all duration-300 w-full">
        <CardContent className="p-4 flex items-center gap-4">
            <Avatar className="h-12 w-12">
                <AvatarImage src={community.communityProfileImage} />
                <AvatarFallback>{community.name?.charAt(0) || 'C'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                <h3 className="font-semibold text-lg truncate col-span-1">{community.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground col-span-1">
                    <Users className="h-4 w-4" />
                    <span>{community.memberCount || 0} members</span>
                </div>
                <div className="flex items-center gap-2 col-span-1 truncate">
                    <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex flex-wrap gap-1 truncate">
                        {displayTags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                        {remainingTags > 0 && <Badge variant="outline">+{remainingTags}</Badge>}
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground col-span-1 justify-self-end">
                    <Calendar className="h-4 w-4" />
                    <span>{community.createdAt ? format(new Date(community.createdAt.seconds * 1000), 'MMM dd, yyyy') : 'N/A'}</span>
                </div>
            </div>
        </CardContent>
    </Card>
  )
}
