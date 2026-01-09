

'use client';

import React from 'react';
import { CommunityMember, UserRole } from '@/lib/types';
import { Checkbox } from '../ui';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Users, Edit, Mail, X, MessageCircle, Trash2, Phone } from 'lucide-react';
import { MemberCard } from '../community/member-card';
import { MemberListItem } from '../community/member-list-item';
import { getThemeForPath } from '@/lib/theme-utils';
import { usePathname, useRouter } from 'next/navigation';
import { Member } from '../broadcast/broadcast-types';
import { Badge } from '@/components/ui';


interface MembersListProps {
  members: CommunityMember[];
  userRole?: UserRole;
  onMemberClick?: (member: CommunityMember) => void;
  selectedMembers?: (Member | CommunityMember)[];
  selectable?: boolean;
  viewMode?: 'grid' | 'list';
  onEditMember?: (member: CommunityMember) => void;
  onRemoveTag?: (memberId: string, tag: string) => void;
  onDeleteMember?: (member: CommunityMember) => void;
  activeColor?: string;
}

export function MembersList({
  members,
  userRole,
  onMemberClick,
  selectedMembers = [],
  selectable,
  viewMode = 'grid',
  onEditMember,
  onRemoveTag,
  onDeleteMember,
  activeColor: activeColorProp
}: MembersListProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { activeColor: themeColor } = getThemeForPath(pathname);
  const activeColor = activeColorProp || themeColor;

  const hexToRgba = (hex: string, alpha: number) => {
    if (!hex || !/^#[0-9A-F]{6}$/i.test(hex)) return 'rgba(0,0,0,0)';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  
  if (members.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Users className="h-12 w-12 mb-4 opacity-50" />
        <p>No members found</p>
      </div>
    );
  }

  const canManage = userRole === 'owner' || userRole === 'admin';

  const handleNavigate = (member: CommunityMember) => {
    // This function is now only for navigation
    const pathParts = pathname.split('/');
    const handle = pathParts[1];
    router.push(`/${handle}/members/${member.userId}`);
  };

  const handleSelect = (e: React.MouseEvent | React.KeyboardEvent, member: CommunityMember) => {
    // This function is for selection
    e.stopPropagation();
    if (onMemberClick) {
      onMemberClick(member);
    }
  };

  const handleTagRemove = (e: React.MouseEvent, memberId: string, tag: string) => {
    e.stopPropagation();
    onRemoveTag?.(memberId, tag);
  }

  if (viewMode === 'list') {
    return (
      <div className="col-span-full space-y-2">
        {members.map((member) => {
          const isSelected = selectedMembers.some((m) => 'userId' in m ? m.userId === member.userId : false);
          console.log(`🎨 [Members List] Rendering member: ${member.userDetails?.displayName}, Tags:`, member.tags);

          return (
            <MemberListItem
              key={member.id}
              member={member}
              isSelected={isSelected}
              selectable={selectable}
              canManage={canManage}
              activeColor={activeColor}
              onClick={() => handleNavigate(member)}
              onSelect={(e) => handleSelect(e, member)}
              onEdit={() => onEditMember?.(member)}
              onDelete={() => onDeleteMember?.(member)}
              onRemoveTag={(tag) => onRemoveTag?.(member.id, tag)}
            />
          );
        })}
      </div>
    );
  }

  // Grid view
  return (
    <div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {members.map((member) => {
        const isSelected = selectedMembers.some((m) => 'userId' in m ? m.userId === member.userId : false);
        return (
          <MemberCard
            key={member.id}
            member={member}
            canManage={canManage}
            borderColor={activeColor}
            onClick={() => handleNavigate(member)}
            onRemoveTag={onRemoveTag}
            selectable={selectable}
            isSelected={isSelected}
            onSelect={(m) => onMemberClick?.(m)}
            onEdit={(m) => onEditMember?.(m)}
            onDelete={(m) => onDeleteMember?.(m)}
          />
        );
      })}
    </div>
  );
}
