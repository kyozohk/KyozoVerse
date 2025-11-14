import { type Community } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageSquare, Tag, Calendar, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { format } from 'date-fns';
import Link from 'next/link';


export function CommunityCard({ community }: { community: Community }) {
  const displayTags = community.tags?.slice(0, 2) || [];
  const remainingTags = community.tags?.length ? community.tags.length - displayTags.length : 0;
  return (
    <Link href={`/c/${community.handle}/feed`} className="block h-full">
      <Card className="hover:shadow-lg transition-shadow duration-300 h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                      <AvatarImage src={community.communityProfileImage} />
                      <AvatarFallback>{community.name?.charAt(0) || 'C'}</AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-lg font-bold">{community.name}</CardTitle>
              </div>
              <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{community.memberCount || 0} members</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>0 messages</span>
            </div>
          </div>
          {displayTags.length > 0 && (
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-wrap gap-1">
                  {displayTags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                  {remainingTags > 0 && <Badge variant="outline">+{remainingTags} more</Badge>}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Created on {community.createdAt ? format(community.createdAt.toDate(), 'MMM dd, yyyy') : 'N/A'}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
