
'use client';

import { Avatar, AvatarFallback, AvatarImage, Button } from '@/components/ui';
import { Card, CardContent } from '@/components/ui/card';
import { CommunityMember } from '@/lib/types';
import { format } from 'date-fns';
import { Mail, MessageCircle, Phone, Edit, Trash2 } from 'lucide-react';

interface MemberCardProps {
    member: CommunityMember;
    canManage: boolean;
}

export function MemberCard({ member, canManage }: MemberCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 h-full">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={member.userDetails?.avatarUrl} />
            <AvatarFallback>{member.userDetails?.displayName?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-foreground">{member.userDetails?.displayName}</p>
            <p className="text-sm text-muted-foreground">{member.role}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Joined: {member.joinedAt ? format(member.joinedAt.toDate(), 'PP') : '-'}
            </p>
          </div>
        </div>
        {canManage && (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <MessageCircle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-400">
                <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
