
'use client';

import { useState, useEffect } from 'react';
import { usePathname, useParams } from 'next/navigation';
import { CustomButton } from '@/components/ui';
import { MessageSquare, CopyCheck, CopyX } from 'lucide-react';
import BroadcastDialog from '@/components/broadcast/broadcast-dialog';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { type CommunityMember, type User, type Community } from '@/lib/types';
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
          
          return {
            id: memberDoc.id,
            ...data,
            userDetails: userSnap.exists() ? userSnap.data() as User : undefined,
          } as CommunityMember;
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
  
  const handleToggleMember = (member: CommunityMember) => {
    setSelectedMembers(prev => 
        prev.some(m => m.id === member.id)
            ? prev.filter(m => m.id !== member.id)
            : [...prev, member]
    );
  };
  
  const handleSelectAll = () => {
    setSelectedMembers(filteredMembers);
  };
  
  const handleDeselectAll = () => {
    setSelectedMembers([]);
  };
  
  const filteredMembers = members.filter(member =>
    member.userDetails?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.userDetails?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="relative min-h-screen">
       <ListView
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        loading={loading}
        actions={
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleSelectAll} style={{ color: activeColor }}>
                <CopyCheck className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDeselectAll} style={{ color: activeColor }}>
                <CopyX className="h-5 w-5" />
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
