
import { type CommunityMember } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, AtSign } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function MemberGridItem({ member }: { member: CommunityMember }) {
  return (
    <Card className="hover:bg-accent/50 transition-colors h-full text-center group">
      <CardContent className="p-6 flex flex-col items-center justify-center">
        <Avatar className="h-24 w-24 mb-4 transition-transform duration-300 group-hover:scale-110 rounded-full">
          <AvatarImage src={member.userDetails?.avatarUrl} alt={member.userDetails?.displayName} />
          <AvatarFallback>{member.userDetails?.displayName?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <p className="font-semibold text-lg">{member.userDetails?.displayName}</p>
        <div className="flex items-center text-sm text-muted-foreground mt-1">
          <Shield className="h-4 w-4 mr-1" />
          <span>{member.role}</span>
        </div>
        <div className="flex items-center justify-center gap-2 mt-4">
            <Button variant="outline" size="sm">Promote</Button>
            <Button variant="ghost" size="sm">Demote</Button>
        </div>
      </CardContent>
    </Card>
  );
}
