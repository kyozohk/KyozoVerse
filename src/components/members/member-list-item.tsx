
import { type CommunityMember } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Tag, User, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '@/components/ui/button';

export function MemberListItem({ member }: { member: CommunityMember }) {
    const displayTags = member.tags?.slice(0, 3) || [];
    const remainingTags = member.tags?.length ? member.tags.length - displayTags.length : 0;

    return (
        <Card className="hover:bg-accent/50 transition-colors">
            <CardContent className="p-4 grid grid-cols-12 gap-4 items-center">
                {/* Member Info */}
                <div className="col-span-12 md:col-span-4 flex items-center gap-4">
                    <Avatar className="h-12 w-12 rounded-full flex-shrink-0">
                        <AvatarImage src={member.userDetails?.avatarUrl} alt={member.userDetails?.displayName} />
                        <AvatarFallback>{member.userDetails?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <p className="font-semibold text-md">{member.userDetails?.displayName}</p>
                        <p className="text-sm text-muted-foreground">{member.userDetails?.email}</p>
                    </div>
                </div>

                {/* Role */}
                <div className="col-span-6 md:col-span-2 flex items-center text-sm text-muted-foreground">
                    <Shield className="h-4 w-4 mr-2" />
                    <Badge variant="outline">{member.role}</Badge>
                </div>

                {/* Tags */}
                <div className="col-span-6 md:col-span-3 flex items-center gap-2 text-sm text-muted-foreground">
                    {displayTags.length > 0 && <Tag className="h-4 w-4" />}
                    <div className="flex flex-wrap gap-1">
                        {displayTags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                        {remainingTags > 0 && <Badge variant="outline">+{remainingTags}</Badge>}
                    </div>
                </div>
                
                {/* Actions */}
                <div className="col-span-12 md:col-span-3 flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm">Promote</Button>
                    <Button variant="ghost" size="sm">Demote</Button>
                </div>
            </CardContent>
        </Card>
    );
};
