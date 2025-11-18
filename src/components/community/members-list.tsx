
'use client';

import { useState } from 'react';
import { CommunityMember, UserRole } from '@/lib/types';
import { MemberCard } from './member-card';
import { ListView } from '@/components/ui/list-view';
import { getThemeForPath } from '@/lib/theme-utils';
import { usePathname } from 'next/navigation';

interface MembersListProps {
  members: CommunityMember[];
  userRole: UserRole;
}

export function MembersList({ members, userRole }: MembersListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const pathname = usePathname();
  const { activeColor } = getThemeForPath(pathname);

  const filteredMembers = members
    ? members.filter(
        (member) =>
          member.userDetails?.displayName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          member.userDetails?.email
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      )
    : [];

  return (
     <div className="bg-card text-foreground p-6 md:p-8 rounded-xl border border-gray-200/80">
      <ListView
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        themeColor={activeColor}
      >
        {filteredMembers.map((member) => (
          <MemberCard key={member.userId} member={member} canManage={userRole === 'admin' || userRole === 'owner'} />
        ))}
      </ListView>
    </div>
  );
}
