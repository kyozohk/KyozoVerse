
'use client';

import { useState, useEffect } from 'react';
import { usePathname, useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { CustomButton } from '@/components/ui';
import { MessageSquare, Search } from 'lucide-react';
import BroadcastDialog from '@/components/broadcast/broadcast-dialog';
import { MembersList } from '@/components/community/members-list';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { type Member, type User, type Community } from '@/lib/types';
import { getCommunityByHandle } from '@/lib/community-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ListView } from '@/components/ui/list-view';

export default function CommunityBroadcastPage() {
  const params = useParams();
  const handle = params.handle as string;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [community, setCommunity] = useState<Community | null>(null);

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

        const membersQuery = query(collection(db, 'communityMembers'), where('communityId', '==', communityData.communityId));
        const membersSnapshot = await getDocs(membersQuery);

        const membersData = await Promise.all(membersSnapshot.docs.map(async (memberDoc) => {
          const data = memberDoc.data();
          const userDocRef = doc(db, 'users', memberDoc.id);
          const userSnap = await getDoc(userDocRef);
          
          return {
            id: memberDoc.id,
            userId: memberDoc.id,
            ...data,
            userDetails: userSnap.exists() ? userSnap.data() as User : undefined,
          } as Member;
        }));
        
        setMembers(membersData);
        // By default, select members with a phone number
        const membersWithPhone = membersData.filter(m => m.userDetails?.phoneNumber);
        setSelectedMembers(membersWithPhone);
        
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
  
  const handleToggleMember = (member: Member) => {
    if (selectedMembers.some(m => m.id === member.id)) {
      setSelectedMembers(selectedMembers.filter(m => m.id !== member.id));
    } else {
      setSelectedMembers([...selectedMembers, member]);
    }
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
        title="Broadcast"
        subtitle="Select members to send a WhatsApp message."
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        loading={loading}
        actions={
          <div className="flex items-center gap-2">
            <CustomButton variant="outline" onClick={handleSelectAll}>Select All</CustomButton>
            <CustomButton variant="outline" onClick={handleDeselectAll}>Deselect All</CustomButton>
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
