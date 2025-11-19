
import { type CommunityMember } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, Edit, Trash2, MessageCircle, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

interface MemberCardProps {
  member: CommunityMember;
  canManage: boolean;
  borderColor?: string;
  onClick?: () => void;
}

export function MemberCard({ member, canManage, borderColor = 'hsl(var(--border))', onClick }: MemberCardProps) {
    
  const hexToRgba = (hex: string, alpha: number) => {
    if (!hex || !/^#[0-9A-F]{6}$/i.test(hex)) return 'rgba(0,0,0,0)';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const itemStyle: React.CSSProperties = {
    '--hover-bg-color': hexToRgba(borderColor, 0.1),
    borderColor: borderColor,
  } as any;

  return (
    <Card 
        className="hover:shadow-lg transition-shadow duration-300 h-full cursor-pointer hover:bg-[var(--hover-bg-color)]"
        style={itemStyle}
        onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={member.userDetails?.avatarUrl} />
              <AvatarFallback>{member.userDetails?.displayName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div>
                <CardTitle className="text-lg font-bold">{member.userDetails?.displayName}</CardTitle>
                <p className="text-sm text-muted-foreground">{member.userDetails?.email}</p>
            </div>
          </div>
          {canManage && <GripVertical className="h-5 w-5 text-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <Badge
            variant={member.status === 'active' ? 'default' : 'destructive'}
            className={cn(
              'capitalize',
              member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            )}
          >
            {member.status}
          </Badge>
          <span>Joined: {member.joinedAt ? format(member.joinedAt.toDate(), 'PP') : '-'}</span>
        </div>
        
        {canManage && (
          <div className="flex justify-end gap-1 pt-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <MessageCircle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <Mail className="h-4 w-4" />
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
