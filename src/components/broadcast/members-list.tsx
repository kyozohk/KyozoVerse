
'use client';

import React from 'react';
import { Member } from './broadcast-types';
import { Avatar, AvatarImage, AvatarFallback, Checkbox } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Phone, Users } from 'lucide-react';

export interface MembersListProps {
  members: Member[];
  onMemberClick?: (member: Member) => void;
  showEmail?: boolean;
  showPhone?: boolean;
  showStatus?: boolean;
  showJoinDate?: boolean;
  emptyMessage?: string;
  className?: string;
  selectedMembers?: Member[];
  selectable?: boolean;
  viewMode?: 'grid' | 'list';
}

const formatDate = (timestamp: any): string => {
  if (!timestamp) return '-';
  const date = timestamp?.toDate?.() || new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const MembersList: React.FC<MembersListProps> = ({
  members,
  onMemberClick,
  showEmail = true,
  showPhone = true,
  showStatus = true,
  showJoinDate = true,
  emptyMessage = "No members found",
  className = "",
  selectedMembers = [],
  selectable = false,
  viewMode = 'list' // Default to list for broadcast
}) => {
  if (members.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12 text-muted-foreground", className)}>
        <Users className="h-12 w-12 mb-4 opacity-50" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {members.map((member) => {
        const isSelected = selectedMembers.some(m => m.id === member.id);
        
        return (
          <div 
            key={member.id} 
            className={cn(
              "flex items-center p-3 border rounded-md",
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
                {member.photoURL ? (
                  <AvatarImage src={member.photoURL} alt={member.displayName} />
                ) : (
                  <AvatarFallback>
                    {member.displayName?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
            
            <div className="flex-grow">
              <div className="font-medium">{member.displayName || 'Unknown Member'}</div>
              <div className="text-sm text-muted-foreground">
                <span className="capitalize">{member.role || 'member'}</span>
                {showEmail && member.email && (
                  <span className="ml-3">{member.email}</span>
                )}
              </div>
            </div>
            
            {showPhone && (
              <div className="flex items-center text-sm mr-4">
                <Phone className="h-4 w-4 mr-1 text-muted-foreground" />
                <span>{member.phone || '-'}</span>
              </div>
            )}
            
            {showStatus && (
              <div className="mr-4">
                <span className={cn(
                  "px-2 py-1 text-xs rounded-full",
                  member.status === 'active' ? "bg-green-100 text-green-800" : 
                  member.status === 'pending' ? "bg-amber-100 text-amber-800" : 
                  "bg-gray-100 text-gray-800"
                )}>
                  {(member.status && member.status.charAt(0).toUpperCase() + member.status.slice(1)) || 'Active'}
                </span>
              </div>
            )}
            
            {showJoinDate && member.joinedAt && (
              <div className="text-sm text-muted-foreground">
                {formatDate(member.joinedAt)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MembersList;
