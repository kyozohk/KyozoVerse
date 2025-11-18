
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Community, CommunityMember, UserRole } from '@/lib/types';
import { ListView } from '@/components/ui/list-view';
import { MemberCard } from './member-card';
import { getThemeForPath } from '@/lib/theme-utils';

interface MembersListProps {
  community: Community;
  members: CommunityMember[];
  userRole: UserRole;
}

export function MembersList({ community, members, userRole }: MembersListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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

  return (
    <ListView
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
    >
      {filteredMembers.map((member) => (
        <MemberCard key={member.userId} member={member} canManage={canManage} borderColor={activeColor} />
      ))}
    </ListView>
  );
}
