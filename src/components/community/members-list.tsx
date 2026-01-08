

'use client';

import React from 'react';
import { CommunityMember, UserRole } from '@/lib/types';
import { Checkbox } from '../ui';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Users, Edit, Mail, X, MessageCircle, Trash2, Phone } from 'lucide-react';
import { MemberCard } from '../community/member-card';
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
  onDeleteMember
}: MembersListProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { activeColor } = getThemeForPath(pathname);

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
          const itemStyle: React.CSSProperties = {
            '--hover-bg-color': hexToRgba(activeColor, 0.08),
            borderColor: isSelected ? activeColor : hexToRgba(activeColor, 0.5),
          } as any;
          if (isSelected) {
            itemStyle.backgroundColor = hexToRgba(activeColor, 0.1);
            itemStyle.borderColor = activeColor;
          }
          console.log(`🎨 [Members List] Rendering member: ${member.userDetails?.displayName}, Tags:`, member.tags);

          return (
            <div
              key={member.id}
              className="flex items-center p-4 border rounded-lg transition-colors cursor-pointer hover:bg-[var(--hover-bg-color)]"
              style={itemStyle}
              onClick={() => handleNavigate(member)}
            >
              {selectable && (
                <div className="mr-4 flex items-center h-full" onClick={(e) => handleSelect(e, member)}>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => {
                        // The parent div's onClick handles the logic
                    }}
                  />
                </div>
              )}
              <Avatar className="h-12 w-12 mr-4">
                <AvatarImage src={member.userDetails?.avatarUrl} />
                <AvatarFallback>
                  {member.userDetails?.displayName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-grow grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                <div className="font-semibold text-base text-foreground truncate">{member.userDetails?.displayName}</div>
                 <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span>{member.userDetails?.email || 'No email'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{member.userDetails?.phone || 'No phone'}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {(member.tags || []).slice(0, 3).map(tag => (
                    <Badge key={tag} variant="secondary" className="group text-xs">
                      {tag}
                      <button onClick={(e) => handleTagRemove(e, member.id, tag)} className="ml-1.5 opacity-50 group-hover:opacity-100">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {(member.tags?.length || 0) > 3 && (
                    <Badge variant="outline">+{member.tags!.length - 3}</Badge>
                  )}
                </div>
              </div>
              {canManage && (
                <div className="flex items-center gap-1 ml-4">
                  <button
                    type="button"
                    className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditMember && onEditMember(member);
                    }}
                    title="Edit member"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Open message dialog
                      console.log('Message member:', member.userDetails?.displayName);
                    }}
                    title="Message member"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Open email dialog
                      console.log('Email member:', member.userDetails?.displayName);
                    }}
                    title="Email member"
                  >
                    <Mail className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="h-8 w-8 flex items-center justify-center rounded-md text-red-500 hover:text-red-400 hover:bg-muted/40"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteMember && onDeleteMember(member);
                    }}
                    title="Delete member"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Grid view
  return (
    <>
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
    </>
  );
}
