
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Community, CommunityMember, User, UserRole } from '@/lib/types';
import { ListView } from '@/components/ui/list-view';
import { MemberCard } from './member-card';
import { getThemeForPath } from '@/lib/theme-utils';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/firebase/firestore';

interface MembersListProps {
  community: Community;
  userRole: UserRole;
}

export function MembersList({ community, userRole }: MembersListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  
  const { activeColor } = getThemeForPath(pathname);

  useEffect(() => {
    if (!community?.communityId) return;

    const membersQuery = query(collection(db, 'communityMembers'), where('communityId', '==', community.communityId));

    const unsubscribe = onSnapshot(membersQuery, async (snapshot) => {
      const membersData = await Promise.all(snapshot.docs.map(async (memberDoc) => {
        const memberData = memberDoc.data() as CommunityMember;
        const userDocRef = doc(db, 'users', memberDoc.id);
        const userDoc = await getDoc(userDocRef);
        
        return {
          ...memberData,
          id: memberDoc.id, // Use the document ID as the member's ID
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
  }, [community?.communityId]);
  

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
      loading={loading}
    >
      {filteredMembers.map((member) => (
        <MemberCard key={member.userId} member={member} canManage={canManage} borderColor={activeColor} />
      ))}
    </ListView>
  );
}
