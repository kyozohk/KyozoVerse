
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Community, CommunityMember, User, UserRole } from '@/lib/types';
import { ListView } from '@/components/ui/list-view';
import { MemberCard } from './member-card';
import { MemberCardSkeleton } from './member-card-skeleton';
import { MemberListSkeleton } from './member-list-skeleton';
import { getThemeForPath } from '@/lib/theme-utils';
import { Checkbox } from '../ui';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';

interface MembersListProps {
  community?: Community;
  members: CommunityMember[];
  userRole?: UserRole;
  onMemberClick?: (member: CommunityMember) => void;
  selectedMembers?: CommunityMember[];
  selectable?: boolean;
  viewMode?: 'grid' | 'list';
}

export function MembersList({ community, members, userRole, onMemberClick, selectedMembers, selectable, viewMode = 'grid' }: MembersListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [internalViewMode, setInternalViewMode] = useState<'grid' | 'list'>(viewMode);
  
  const currentViewMode = selectable ? viewMode : internalViewMode;

  const pathname = usePathname();
  const { activeColor } = getThemeForPath(pathname);
  
  const filteredMembers = (members || []).filter(
    (member) =>
      member.userDetails?.displayName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      member.userDetails?.email
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
  );
  
  const canManage = userRole === 'owner' || userRole === 'admin';
  
  const hexToRgba = (hex: string, alpha: number) => {
    if (!hex || !/^#[0-9A-F]{6}$/i.test(hex)) return 'rgba(0,0,0,0)';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const ListComponent = (
    <div className="space-y-2 p-2">
        {filteredMembers.length === 0 ? (
            <div className={cn("flex flex-col items-center justify-center py-12 text-muted-foreground")}>
                <Users className="h-12 w-12 mb-4 opacity-50" />
                <p>No members found</p>
            </div>
        ) : filteredMembers.map((member) => {
          const isSelected = selectedMembers?.some(m => m.userId === member.userId);
          const itemStyle = isSelected
              ? { borderColor: activeColor, backgroundColor: hexToRgba(activeColor, 0.3) }
              : {};
          
          return (
            <div 
              key={member.userId} 
              className={cn(
                "flex items-center p-4 border rounded-lg transition-colors",
                {
                  "hover:bg-primary/5": onMemberClick && !isSelected
                },
                onMemberClick ? "cursor-pointer" : ""
              )}
               style={itemStyle}
              onClick={() => onMemberClick && onMemberClick(member)}
            >
              {selectable && (
                  <div className="mr-4" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      id={`member-${member.userId}`}
                      checked={isSelected}
                      onCheckedChange={() => onMemberClick && onMemberClick(member)}
                    />
                  </div>
              )}
              <div className="mr-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={member.userDetails?.avatarUrl} />
                  <AvatarFallback>{member.userDetails?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-grow">
                <div className="font-semibold text-base">{member.userDetails?.displayName}</div>
                <p className="text-sm text-muted-foreground">{member.userDetails?.email}</p>
              </div>
               <div className="text-sm text-muted-foreground">
                <p>{member.userDetails?.phoneNumber}</p>
              </div>
            </div>
          );
        })}
    </div>
  );

  const GridComponent = (
     <>
        {filteredMembers.map((member) => (
            <MemberCard key={member.userId} member={member} canManage={canManage} borderColor={activeColor} />
        ))}
     </>
  );

  // If used for selection on broadcast page
  if (selectable) {
      if(currentViewMode === 'list') return ListComponent;
      return GridComponent; // grid is default for selectable
  }
  
  // If used on the community overview page (no ListView wrapper)
  if(!community) {
      return currentViewMode === 'grid' ? <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">{GridComponent}</div> : ListComponent;
  }

  // Standalone Member List for dedicated /members page
  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
        <CardDescription>
          Browse and manage community members.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ListView
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          viewMode={currentViewMode}
          onViewModeChange={setInternalViewMode}
          loading={!members}
        >
          {currentViewMode === 'grid' ? GridComponent : ListComponent}
        </ListView>
      </CardContent>
    </Card>
  );
}
