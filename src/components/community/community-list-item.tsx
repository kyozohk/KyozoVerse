
import { type Community } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Tag, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { format, isValid } from 'date-fns';
import Link from 'next/link';

function safeFormat(date: any, formatString: string) {
    const d = date?.toDate ? date.toDate() : new Date(date);
    if (isValid(d)) {
        return format(d, formatString);
    }
    return 'N/A';
}

export function CommunityListItem({ community }: { community: Community }) {
    const displayTags = community.tags?.slice(0, 3) || [];
    const remainingTags = community.tags?.length ? community.tags.length - displayTags.length : 0;
  
    return (
        <Link href={`/${community.handle}`}>
            <Card className="hover:bg-accent/50 transition-colors">
                <CardContent className="p-6 grid grid-cols-12 gap-4 items-center">
                    {/* Community Info (4 columns) */}
                    <div className="col-span-12 md:col-span-4 flex items-center gap-4">
                        <Avatar className="h-20 w-20 rounded-lg flex-shrink-0">
                            <AvatarImage src={community.communityProfileImage} alt={community.name} />
                            <AvatarFallback>{community.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <p className="font-semibold text-md">{community.name}</p>
                    </div>

                    {/* Member Count (2 columns) */}
                    <div className="col-span-6 md:col-span-2 flex items-center text-sm text-muted-foreground">
                        <Users className="h-4 w-4 mr-2" />
                        <span>{community.memberCount || 0} members</span>
                    </div>

                    {/* Tags (3 columns) */}
                    <div className="col-span-6 md:col-span-3 flex items-center gap-2 text-sm text-muted-foreground">
                        {displayTags.length > 0 && <Tag className="h-4 w-4" />}
                        <div className="flex flex-wrap gap-1">
                            {displayTags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                            {remainingTags > 0 && <Badge variant="outline">+{remainingTags}</Badge>}
                        </div>
                    </div>

                    {/* Created Date (3 columns) */}
                    <div className="col-span-12 md:col-span-3 flex items-center justify-start md:justify-end text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Created {safeFormat(community.createdAt, 'MMM dd, yyyy')}</span>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
};
