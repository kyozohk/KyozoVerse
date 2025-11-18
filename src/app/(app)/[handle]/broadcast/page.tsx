
'use client';

import { useState, useEffect } from 'react';
import { usePathname, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CustomButton } from '@/components/ui';
import { MessageSquare, Search, Users } from 'lucide-react';
import BroadcastDialog from '@/components/broadcast/broadcast-dialog';
import { MembersList } from '@/components/community/members-list';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Member, User, Community } from '@/lib/types';
import { getCommunityByHandle } from '@/lib/community-utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function CommunityBroadcastPage() {
  const params = useParams();
  const handle = params.handle as string;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [community, setCommunity] = useState<Community | null>(null);
  const [showMemberSelection, setShowMemberSelection] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'name' | 'phone'>('all');
  const [showOnlyWithPhone, setShowOnlyWithPhone] = useState(true);

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
        
        // Select members with phone numbers by default
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
      alert('Please select at least one member with a phone number to send a message to.');
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
    const filteredMembers = filterMembers();
    setSelectedMembers(filteredMembers);
  };
  
  const handleDeselectAll = () => {
    setSelectedMembers([]);
  };
  
  const filterMembers = () => {
    return members.filter(member => {
      if (showOnlyWithPhone && !member.userDetails?.phoneNumber) {
        return false;
      }
      
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      const userDetails = member.userDetails;

      switch (filterType) {
        case 'name':
          return userDetails?.displayName?.toLowerCase().includes(searchLower) || false;
        case 'phone':
          return userDetails?.phoneNumber?.includes(searchTerm) || false;
        case 'all':
        default:
          return (
            (userDetails?.displayName?.toLowerCase().includes(searchLower) || false) ||
            (userDetails?.email?.toLowerCase().includes(searchLower) || false) ||
            (userDetails?.phoneNumber?.includes(searchTerm) || false)
          );
      }
    });
  };

  const filteredMembers = filterMembers();
  
  return (
    <div className="p-6 md:p-8">
      <div className="bg-card text-foreground p-6 md:p-8 rounded-xl border border-gray-200/80">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-1">Broadcast</h1>
          <p className="text-muted-foreground">Send WhatsApp messages to your community members.</p>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : showMemberSelection ? (
          <div>
            <div className="flex items-center justify-between mb-6 gap-4">
              <div className="flex-grow max-w-md">
                <Input
                  label="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                  icon={<Search className="h-4 w-4 text-muted-foreground" />}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <CustomButton
                  variant="outline"
                  onClick={handleSelectAll}
                >
                  Select All
                </CustomButton>
                <CustomButton
                  variant="outline"
                  onClick={handleDeselectAll}
                >
                  Deselect All
                </CustomButton>
                <CustomButton
                  variant="outline"
                  onClick={() => setShowOnlyWithPhone(!showOnlyWithPhone)}
                >
                  {showOnlyWithPhone ? "Show All" : "Only With Phone"}
                </CustomButton>
              </div>
            </div>
            
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">{selectedMembers.length}</span> selected / 
                <span className="text-muted-foreground"> {filteredMembers.length} filtered / {members.length} total</span>
              </div>
              
              <CustomButton
                variant="primary"
                onClick={handleNewBroadcast}
                disabled={selectedMembers.length === 0}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message ({selectedMembers.length})
              </CustomButton>
            </div>
            
            <MembersList
              community={community!}
              members={filteredMembers}
              userRole="admin" // Assume admin for selection purposes on this page
              onMemberClick={handleToggleMember}
              selectedMembers={selectedMembers}
              selectable={true}
            />
            
            <div className="mt-6 flex justify-end">
              <CustomButton
                variant="outline"
                onClick={() => setShowMemberSelection(false)}
              >
                Cancel
              </CustomButton>
              <CustomButton
                variant="primary"
                onClick={handleNewBroadcast}
                disabled={selectedMembers.length === 0}
                className="ml-2"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message ({selectedMembers.length})
              </CustomButton>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {/* New Broadcast Card */}
            <Card
              className="flex items-center justify-center border-dashed border-2 h-full min-h-[178px] cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
              onClick={() => setShowMemberSelection(true)}
            >
              <div className="text-center text-muted-foreground">
                <MessageSquare className="mx-auto h-10 w-10 mb-2" />
                <span className="font-medium">New WhatsApp Broadcast</span>
              </div>
            </Card>
          </div>
        )}
      
      <BroadcastDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        members={selectedMembers.filter(m => m.userDetails?.phoneNumber)}
      />
      </div>
    </div>
  );
}
