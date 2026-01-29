

'use client';

import React from 'react';
import { Member } from './broadcast-types';
import { CommunityMember } from '@/lib/types';
import { Avatar, AvatarImage, AvatarFallback, Checkbox } from '@/components/ui';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Phone, Users } from 'lucide-react';
import { MemberCard } from '../community/member-card';

export interface MembersListProps {
  members: (Member | CommunityMember)[];
  onMemberClick?: (member: Member | CommunityMember) => void;
  showEmail?: boolean;
  showPhone?: boolean;
  showStatus?: boolean;
  showJoinDate?: boolean;
  emptyMessage?: string;
  className?: string;
  selectedMembers?: (Member | CommunityMember)[];
  selectable?: boolean;
  viewMode?: 'grid' | 'list';
  activeColor?: string;
  loading?: boolean;
}

const formatDate = (timestamp: any): string => {
  if (!timestamp) return '-';
  try {
    const date = timestamp?.toDate?.() || new Date(timestamp);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return '-';
  }
};

export const MembersList: React.FC<MembersListProps> = ({
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
  viewMode = 'list', // Default to list for broadcast
  activeColor,
  loading = false,
}) => {
  // Show skeleton loading state
  if (loading) {
    return (
      <div className={cn("space-y-2", className)}>
        {Array(5).fill(0).map((_, i) => (
          <div key={`skeleton-${i}`} className="flex items-center p-3 border rounded-md">
            {selectable && <Skeleton className="h-4 w-4 mr-3 rounded" />}
            <Skeleton className="h-10 w-10 rounded-full mr-3" />
            <div className="flex-grow">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
            {showPhone && <Skeleton className="h-4 w-24 mr-4" />}
            {showStatus && <Skeleton className="h-6 w-16 mr-4 rounded-full" />}
            {showJoinDate && <Skeleton className="h-4 w-20" />}
          </div>
        ))}
      </div>
    );
  }
  
  // Show empty state
  if (members.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12 text-muted-foreground", className)}>
        <Users className="h-12 w-12 mb-4 opacity-50" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  // Helper function to check if a member is a CommunityMember
  const isCommunityMember = (member: Member | CommunityMember): member is CommunityMember => {
    return 'userId' in member && 'communityId' in member;
  };
  
  // Helper function to get email from either Member or CommunityMember
  const getEmail = (member: Member | CommunityMember): string | undefined => {
    if (isCommunityMember(member)) {
      return member.userDetails?.email;
    } else {
      return member.email;
    }
  };
  
  // Helper function to get phone from either Member or CommunityMember
  const getPhone = (member: Member | CommunityMember): string | undefined => {
    if (isCommunityMember(member)) {
      return (member.userDetails as any)?.phone;
    } else {
      return member.phone;
    }
  };
  
  // Helper function to get photo URL from either Member or CommunityMember
  const getPhotoURL = (member: Member | CommunityMember): string | undefined => {
    if (isCommunityMember(member)) {
      return member.userDetails?.avatarUrl;
    } else {
      return member.photoURL;
    }
  };
  
  // Helper function to get display name from either Member or CommunityMember
  const getDisplayName = (member: Member | CommunityMember): string => {
    if (isCommunityMember(member)) {
      return member.userDetails?.displayName || 'Unknown Member';
    } else {
      return member.displayName || 'Unknown Member';
    }
  };

  // Helper function to convert hex color to rgba for transparency effects
  const hexToRgba = (hex: string, alpha: number) => {
    if (!hex || !/^#[0-9A-F]{6}$/i.test(hex)) return 'rgba(0,0,0,0)'; // Return transparent if invalid hex
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  
  // Apply theme colors based on active color
  const getItemStyle = (isSelected: boolean) => {
    if (!activeColor) return {};
    
    return isSelected 
      ? { backgroundColor: hexToRgba(activeColor, 0.18), borderColor: activeColor }
      : { borderColor: hexToRgba(activeColor, 0.35), '--hover-bg-color': hexToRgba(activeColor, 0.08) } as React.CSSProperties;
  };

  if(viewMode === 'grid') {
    return (
        <>
            {(members as CommunityMember[]).map((member) => {
                const canManage = false;
                return (
                    <MemberCard
                        key={member.userId}
                        member={member}
                        canManage={canManage}
                        borderColor={activeColor}
                        onClick={() => onMemberClick && onMemberClick(member)}
                    />
                )
            })}
        </>
    )
  }

  return (
    <div className={cn("space-y-2 col-span-full", className)}>
      {members.map((member) => {
        const isSelected = selectedMembers.some(m => {
    // Handle both Member and CommunityMember types
    const memberId = isCommunityMember(m) ? m.userId : (m as Member).id;
    const currentId = isCommunityMember(member) ? member.userId : (member as Member).id;
    return memberId === currentId;
  });
        const itemStyle = getItemStyle(isSelected);

        // Generate a unique key for the member
        const memberKey = isCommunityMember(member) ? `cm-${member.userId}` : `m-${(member as Member).id}`;
        
        return (
          <div 
            key={memberKey} 
            className={cn(
              "flex items-center p-3 border rounded-md transition-colors text-foreground",
              "hover:bg-[var(--hover-bg-color)]",
              onMemberClick ? "cursor-pointer" : ""
            )}
            style={itemStyle}
            onClick={() => onMemberClick && onMemberClick(member)}
          >
            {selectable && (
              <div className="mr-3" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  id={`member-${isCommunityMember(member) ? member.userId : (member as Member).id}`}
                  checked={isSelected}
                  onCheckedChange={() => onMemberClick && onMemberClick(member)}
                />
              </div>
            )}
            
            <div className="mr-3">
              <Avatar className="h-10 w-10">
                {getPhotoURL(member) ? (
                  <AvatarImage src={getPhotoURL(member)} alt={getDisplayName(member)} />
                ) : (
                  <AvatarFallback>
                    {getDisplayName(member).charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
            
            <div className="flex-grow">
              <div className="font-medium">
                {isCommunityMember(member) 
                  ? member.userDetails?.displayName || 'Unknown Member'
                  : member.displayName || 'Unknown Member'}
              </div>
              {showEmail && getEmail(member) && (
                <div className="text-sm text-muted-foreground">
                    {getEmail(member)}
                </div>
              )}
               {showPhone && (
                <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="h-3 w-3 mr-1.5" />
                    <span>{getPhone(member) || '-'}</span>
                </div>
                )}
            </div>
            
            
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
