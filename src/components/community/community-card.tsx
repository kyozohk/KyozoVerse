
import { type Community } from '@/lib/types';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Users, Tag, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { format } from 'date-fns';


export function CommunityCard({ community }: { community: Community }) {
  const displayTags = community.tags?.slice(0, 2) || [];
  const remainingTags = community.tags?.length ? community.tags.length - displayTags.length : 0;
  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 h-full flex flex-col items-center justify-center text-center p-6">
      <Avatar className="h-14 w-14 mb-4">
        <AvatarImage src={community.communityProfileImage} />
        <AvatarFallback className="text-2xl">{community.name?.charAt(0) || 'C'}</AvatarFallback>
      </Avatar>
      <CardTitle className="text-lg font-bold">{community.name}</CardTitle>
      <p className="text-sm text-muted-foreground mt-1">{community.memberCount || 0} members</p>
      
      {displayTags.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-center mt-3">
            {displayTags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
            {remainingTags > 0 && <Badge variant="outline">+{remainingTags}</Badge>}
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
        <Calendar className="h-3 w-3" />
        <span>Created {community.createdAt ? format(new Date(community.createdAt.seconds * 1000), 'MMM dd, yyyy') : 'N/A'}</span>
      </div>
    </Card>
  );
}
