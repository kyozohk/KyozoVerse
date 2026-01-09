'use client';

import React from 'react';
import { CommunityMember } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Phone, Edit, MessageCircle, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MemberListItemProps {
  member: CommunityMember;
  isSelected?: boolean;
  selectable?: boolean;
  canManage?: boolean;
  activeColor?: string;
  onClick?: () => void;
  onSelect?: (e: React.MouseEvent | React.KeyboardEvent) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onRemoveTag?: (tag: string) => void;
}

export function MemberListItem({
  member,
  isSelected = false,
  selectable = false,
  canManage = false,
  activeColor = '#926B7F',
  onClick,
  onSelect,
  onEdit,
  onDelete,
  onRemoveTag,
}: MemberListItemProps) {
  const hexToRgba = (hex: string, alpha: number) => {
    if (!hex || !/^#[0-9A-F]{6}$/i.test(hex)) return 'rgba(0,0,0,0)';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const [isHovered, setIsHovered] = React.useState(false);

  const itemStyle: React.CSSProperties = {
    borderColor: isSelected ? activeColor : hexToRgba(activeColor, 0.5),
    backgroundColor: isHovered 
      ? hexToRgba(activeColor, 0.08) 
      : isSelected 
        ? hexToRgba(activeColor, 0.1) 
        : 'transparent',
  };

  const handleTagRemove = (e: React.MouseEvent, tag: string) => {
    e.stopPropagation();
    onRemoveTag?.(tag);
  };

  return (
    <div
      className="flex items-center p-4 border rounded-lg transition-colors cursor-pointer"
      style={itemStyle}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {selectable && (
        <div className="mr-4 flex items-center h-full" onClick={onSelect}>
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
        <div className="font-semibold text-base text-foreground truncate">
          {member.userDetails?.displayName}
        </div>
        
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
              {onRemoveTag && (
                <button 
                  onClick={(e) => handleTagRemove(e, tag)} 
                  className="ml-1.5 opacity-50 group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
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
              onEdit?.();
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
              onDelete?.();
            }}
            title="Delete member"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
