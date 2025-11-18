
'use client';

import { useState, useEffect } from 'react';
import { usePathname, useParams } from 'next/navigation';
import { CustomButton } from '@/components/ui';
import { MessageSquare, CopyCheck, CopyX } from 'lucide-react';
import BroadcastDialog from '@/components/broadcast/broadcast-dialog';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { type CommunityMember, type User, type Community } from '@/lib/types';
import { Member } from '@/components/broadcast/broadcast-types';
import { getCommunityByHandle } from '@/lib/community-utils';
import { ListView } from '@/components/ui/list-view';
import MembersList from '@/components/broadcast/members-list';
import { Button } from '@/components/ui/button';
import { getThemeForPath } from '@/lib/theme-utils';

export default function CommunityBroadcastPage() {
  const params = useParams();
  const handle = params.handle as string;
  const pathname = usePathname();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  // Define a handler for view mode changes that works with the ListView component
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
  };
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [community, setCommunity] = useState<Community | null>(null);

  const { activeColor } = getThemeForPath(pathname);

  // Fetch community and members data
  useEffect(() => {
    const fetchData = async () => {
      if (!handle) return;
      try {
        setLoading(true);
        const communityData = await getCommunityByHandle(handle);
        if (!communityData) {
          console.error('Community not found');
          setLoading(false);
          return;
        }
        setCommunity(communityData);

        const membersQuery = query(collection(db, "communityMembers"), where("communityId", "==", communityData.communityId));
        const membersSnapshot = await getDocs(membersQuery);

        const membersData = await Promise.all(membersSnapshot.docs.map(async (memberDoc) => {
          const data = memberDoc.data();
          const userDocRef = doc(db, 'users', data.userId);
          const userSnap = await getDoc(userDocRef);
          
          // Create a properly typed CommunityMember object
          const memberData: CommunityMember = {
            userId: data.userId,
            communityId: data.communityId,
            role: data.role || 'member',
            joinedAt: data.joinedAt,
            status: data.status || 'active',
            userDetails: userSnap.exists() ? userSnap.data() as User : undefined
          };
          
          return memberData;
        }));
        
        setMembers(membersData);
        // By default, select all members
        setSelectedMembers(membersData);
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [handle]);

  const handleNewBroadcast = () => {
    if (selectedMembers.length === 0) {
      alert('Please select at least one member to send a message to.');
      return;
    }
    setIsDialogOpen(true);
  };
  
  const handleToggleMember = (member: Member | CommunityMember) => {
    const memberId = 'userId' in member ? member.userId : member.id;
    
    setSelectedMembers(prev => 
        prev.some(m => ('userId' in m ? m.userId : (m as Member).id) === memberId)
            ? prev.filter(m => ('userId' in m ? m.userId : (m as Member).id) !== memberId)
            : [...prev, member as CommunityMember]
    );
  };
  
  const filteredMembers = members.filter(member =>
    member.userDetails?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.userDetails?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allSelected = filteredMembers.length > 0 && selectedMembers.length === filteredMembers.length;

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(filteredMembers);
    }
  };
  
  return (
    <div className="relative min-h-screen">
       <ListView
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        loading={loading}
        actions={
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleToggleSelectAll} style={{ color: activeColor }}>
              {allSelected ? <CopyX className="h-5 w-5" /> : <CopyCheck className="h-5 w-5" />}
            </Button>
          </div>
        }
      >
        <MembersList
            members={filteredMembers}
            onMemberClick={handleToggleMember}
            selectedMembers={selectedMembers}
            selectable={true}
            viewMode={viewMode}
            activeColor={activeColor}
            loading={loading}
        />
      </ListView>
      
      {selectedMembers.length > 0 && (
        <div className="fixed bottom-8 right-8 z-50">
            <CustomButton
                variant="primary"
                size="large"
                onClick={handleNewBroadcast}
            >
                <MessageSquare className="h-5 w-5 mr-2" />
                Send Message ({selectedMembers.length})
            </CustomButton>
        </div>
      )}
      
      <BroadcastDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        members={selectedMembers}
      />
    </div>
  );
}
