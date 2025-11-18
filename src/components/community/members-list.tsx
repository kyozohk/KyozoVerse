
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Community, CommunityMember, User, UserRole } from '@/lib/types';
import { ListView } from '@/components/ui/list-view';
import { MemberCard } from './member-card';
import { getThemeForPath } from '@/lib/theme-utils';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Checkbox } from '../ui';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Users } from 'lucide-react';

interface MembersListProps {
  community: Community;
  members?: CommunityMember[];
  userRole: UserRole;
  onMemberClick?: (member: CommunityMember) => void;
  selectedMembers?: CommunityMember[];
  selectable?: boolean;
}

export function MembersList({ community, members: initialMembers = [], userRole, onMemberClick, selectedMembers, selectable }: MembersListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [members, setMembers] = useState<CommunityMember[]>(initialMembers);
  const [loading, setLoading] = useState(!initialMembers.length);
  const pathname = usePathname();
  
  const { activeColor } = getThemeForPath(pathname);

  useEffect(() => {
    // If members are passed directly, use them
    if (initialMembers.length) {
      setMembers(initialMembers);
      setLoading(false);
      return;
    }

    // Otherwise, fetch them
    if (!community?.communityId) {
      setLoading(false);
      return;
    }

    const membersQuery = query(collection(db, 'communityMembers'), where('communityId', '==', community.communityId));

    const unsubscribe = onSnapshot(membersQuery, async (snapshot) => {
      const membersData = await Promise.all(snapshot.docs.map(async (memberDoc) => {
        const memberData = memberDoc.data() as CommunityMember;
        const userDocRef = doc(db, 'users', memberDoc.id);
        const userDoc = await getDoc(userDocRef);
        
        return {
          ...memberData,
          id: memberDoc.id,
          userId: memberDoc.id,
          userDetails: userDoc.exists() ? userDoc.data() as User : undefined,
        };
      }));
      setMembers(membersData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching members with user details:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [community?.communityId, initialMembers]);
  

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

  if (viewMode === 'list' && selectable) {
    return (
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
                  <div className="mr-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      id={`member-${member.id}`}
                      checked={isSelected}
                      onCheckedChange={() => onMemberClick && onMemberClick(member)}
                    />
                  </div>
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
    )
  }

  return (
    <ListView
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      loading={loading}
    >
      {filteredMembers.map((member) => (
        <MemberCard key={member.userId} member={member} canManage={canManage} borderColor={activeColor} />
      ))}
    </ListView>
  );
}
