
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Community, CommunityMember, User, UserRole } from '@/lib/types';
import { ListView } from '@/components/ui/list-view';
import { MemberCard } from './member-card';
import { getThemeForPath } from '@/lib/theme-utils';
import { Checkbox } from '../ui';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Users } from 'lucide-react';

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

  const ListComponent = (
    <div className="space-y-2">
        {filteredMembers.length === 0 ? (
            <div className={cn("flex flex-col items-center justify-center py-12 text-muted-foreground")}>
                <Users className="h-12 w-12 mb-4 opacity-50" />
                <p>No members found</p>
            </div>
        ) : filteredMembers.map((member) => {
          const isSelected = selectedMembers?.some(m => m.id === member.id);
          return (
            <div 
              key={member.id} 
              className={cn(
                "flex items-center p-3 border rounded-md transition-colors",
                isSelected ? "bg-primary/5 border-primary" : "hover:bg-muted/30",
                onMemberClick ? "cursor-pointer" : ""
              )}
              onClick={() => onMemberClick && onMemberClick(member)}
            >
              {selectable && (
                  <div className="mr-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      id={`member-${member.id}`}
                      checked={isSelected}
                      onCheckedChange={() => onMemberClick && onMemberClick(member)}
                    />
                  </div>
              )}
              <div className="mr-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.userDetails?.avatarUrl} />
                  <AvatarFallback>{member.userDetails?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-grow">
                <div className="font-medium">{member.userDetails?.displayName}</div>
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
            <MemberCard key={member.id} member={member} canManage={canManage} borderColor={activeColor} />
        ))}
     </>
  );

  if (selectable) {
      if(currentViewMode === 'list') return ListComponent;
      return GridComponent; // grid is default for selectable
  }

  return (
    <ListView
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      viewMode={currentViewMode}
      onViewModeChange={setInternalViewMode}
      loading={!members}
    >
      {currentViewMode === 'grid' ? GridComponent : ListComponent}
    </ListView>
  );
}
