
'use client';

import { useState, useEffect } from 'react';
import { usePathname, useParams } from 'next/navigation';
import { ListView } from '@/components/ui/list-view';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CustomButton } from '@/components/ui';
import { PlusCircle, MessageSquare, Search, Users, Check } from 'lucide-react';
import BroadcastDialog from '@/components/broadcast/broadcast-dialog';
import MembersList from '@/components/broadcast/members-list';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Member } from '@/components/broadcast/broadcast-types';

export default function CommunityBroadcastPage() {
  const pathname = usePathname();
  const params = useParams();
  const handle = params.handle as string;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [communityId, setCommunityId] = useState<string>('');
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showMemberSelection, setShowMemberSelection] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'name' | 'phone'>('all');
  const [showOnlyWithPhone, setShowOnlyWithPhone] = useState(true);

  // Fetch community and members data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get community ID from handle
        const communityQuery = query(collection(db, 'communities'), where('handle', '==', handle));
        const communitySnapshot = await getDocs(communityQuery);
        
        if (communitySnapshot.empty) {
          console.error('Community not found');
          setLoading(false);
          return;
        }
        
        const communityDoc = communitySnapshot.docs[0];
        const communityData = { id: communityDoc.id, ...communityDoc.data() };
        setCommunityId(communityDoc.id);
        
        // Get community members
        const membersQuery = query(collection(db, 'communityMembers'), where('communityId', '==', communityDoc.id));
        const membersSnapshot = await getDocs(membersQuery);
        
        const membersData = membersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            displayName: data.displayName || 'Unknown Member',
            email: data.email,
            phone: data.phone,
            photoURL: data.photoURL,
            role: data.role || 'member',
            status: data.status || 'active',
            joinedAt: data.joinedAt
          } as Member;
        });
        
        setMembers(membersData);
        
        // Select members with phone numbers by default
        const membersWithPhone = membersData.filter(m => m.phone);
        setSelectedMembers(membersWithPhone);
        
        // TODO: Fetch past broadcasts when we implement history
        // For now, we'll just use an empty array
        setBroadcasts([]);
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (handle) {
      fetchData();
    }
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
      // Apply phone filter
      if (showOnlyWithPhone && !member.phone) {
        return false;
      }
      
      // If no search term, return after applying phone filter
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      
      // Apply search based on filter type
      switch (filterType) {
        case 'name':
          return member.displayName?.toLowerCase().includes(searchLower) || false;
        case 'phone':
          return member.phone?.includes(searchTerm) || false;
        case 'all':
        default:
          return (
            (member.displayName?.toLowerCase().includes(searchLower) || false) ||
            (member.email?.toLowerCase().includes(searchLower) || false) ||
            (member.phone?.includes(searchTerm) || false)
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
            <div className="flex items-center justify-between mb-6">
              <div className="flex-grow max-w-md">
                <Input
                  placeholder="Search members..."
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
              members={filteredMembers}
              onMemberClick={handleToggleMember}
              showEmail={true}
              showPhone={true}
              showStatus={false}
              showJoinDate={false}
              emptyMessage="No members found matching your search."
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
            
            {/* Past broadcasts will be listed here */}
            {broadcasts.map((broadcast) => (
              <Card key={broadcast.id} className="p-4">
                {/* Broadcast details */}
              </Card>
            ))}
          </div>
        )}
      
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md shadow-md z-50">
          {successMessage}
          <button 
            className="ml-4 text-green-700 hover:text-green-900" 
            onClick={() => setSuccessMessage('')}
          >
            ✕
          </button>
        </div>
      )}
      
      {/* Broadcast Dialog */}
      <BroadcastDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setShowMemberSelection(false);
          // If we have broadcast results, show a success message
          setSuccessMessage('WhatsApp broadcast sent successfully!');
          // After 5 seconds, clear the success message
          setTimeout(() => setSuccessMessage(''), 5000);
        }}
        members={selectedMembers.filter(m => m.phone)} // Only include selected members with phone numbers
      />
      </div>
    </div>
  );
}
