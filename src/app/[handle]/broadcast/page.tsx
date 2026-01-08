
'use client';

import { useState, useEffect } from 'react';
import { usePathname, useParams } from 'next/navigation';
import { CustomButton } from '@/components/ui';
import { MessageSquare, CopyCheck, CopyX, Mail } from 'lucide-react';
import BroadcastDialog from '@/components/broadcast/broadcast-dialog';
import { EmailSendDialog } from '@/components/broadcast/email-send-dialog';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { type CommunityMember, type User, type Community } from '@/lib/types';
import { Member } from '@/components/broadcast/broadcast-types';
import { getCommunityByHandle } from '@/lib/community-utils';
import { getCommunityTags, type CommunityTag } from '@/lib/community-tags';
import { ListView } from '@/components/ui/list-view';
import { MembersList } from '@/components/community/members-list';
import { Button } from '@/components/ui/button';
import { getThemeForPath } from '@/lib/theme-utils';
import { CommunityHeader } from '@/components/community/community-header';
import { useAuth } from '@/hooks/use-auth';
import { getUserRoleInCommunity } from '@/lib/community-utils';

export default function CommunityBroadcastPage() {
  const { user } = useAuth();
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
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [userRole, setUserRole] = useState<string>('guest');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [availableTags, setAvailableTags] = useState<CommunityTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

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

        if (user) {
          const role = await getUserRoleInCommunity(user.uid, communityData.communityId);
          setUserRole(role);
        }

        // Fetch available tags for this community
        const tags = await getCommunityTags(communityData.communityId);
        setAvailableTags(tags);

        const membersQuery = query(collection(db, "communityMembers"), where("communityId", "==", communityData.communityId));
        const membersSnapshot = await getDocs(membersQuery);

        const membersData = await Promise.all(membersSnapshot.docs.map(async (memberDoc) => {
          const data = memberDoc.data();
          const userDocRef = doc(db, 'users', data.userId);
          const userSnap = await getDoc(userDocRef);
          
          const memberData: CommunityMember = {
            id: memberDoc.id,
            userId: data.userId,
            communityId: data.communityId,
            role: data.role || 'member',
            joinedAt: data.joinedAt,
            status: data.status || 'active',
            tags: data.tags || [],
            userDetails: userSnap.exists() ? userSnap.data() as User : undefined
          };
          
          return memberData;
        }));
        
        setMembers(membersData);
        setSelectedMembers(membersData);
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [handle, user]);

  // Fetch WhatsApp templates from backend, similar to reference project
  useEffect(() => {
    const fetchTemplates = async () => {
      console.log('[BroadcastPage] Fetching templates from 360dialog API...');
      setLoadingTemplates(true);
      try {
        const res = await fetch('/api/whatsapp/templates');
        const data = await res.json();
        console.log('[BroadcastPage] Templates response:', data);

        if (data.success && Array.isArray(data.templates) && data.templates.length > 0) {
          setTemplates(data.templates);
          console.log('[BroadcastPage] Processed templates count:', data.templates.length);
        } else {
          console.warn('[BroadcastPage] No templates returned from /api/whatsapp/templates, keeping fallback behavior');
          setTemplates([]);
        }
      } catch (err) {
        console.error('[BroadcastPage] Error fetching templates:', err);
        setTemplates([]);
      } finally {
        setLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleNewBroadcast = () => {
    if (selectedMembers.length === 0) {
      alert('Please select at least one member to send a message to.');
      return;
    }
    setIsDialogOpen(true);
  };
  
  const handleToggleMember = (member: CommunityMember) => {
    const memberId = member.userId;
    
    setSelectedMembers(prev => 
        prev.some(m => m.userId === memberId)
            ? prev.filter(m => m.userId !== memberId)
            : [...prev, member]
    );
  };

  const handleToggleTag = (tagName: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tagName)) {
        return prev.filter(t => t !== tagName);
      } else {
        return [...prev, tagName];
      }
    });
  };
  
  // Filter members based on search term and selected tags
  const filteredMembers = members.filter(member => {
    // Search filter
    const matchesSearch = !searchTerm || 
      member.userDetails?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.userDetails?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Tag filter
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(selectedTag => (member.tags || []).includes(selectedTag));
    
    return matchesSearch && matchesTags;
  });

  const allSelected = filteredMembers.length > 0 && selectedMembers.length === filteredMembers.length;

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(filteredMembers);
    }
  };
  
  // Calculate member count excluding owner
  const nonOwnerMembers = members.filter(m => m.role !== 'owner');
  const memberCountExcludingOwner = nonOwnerMembers.length;

  return (
    <div className="space-y-8">
      {community && (
        <CommunityHeader 
          community={community} 
          userRole={userRole as any} 
          memberCount={memberCountExcludingOwner}
          customActions={
            <>
              <CustomButton 
                variant="rounded-rect" 
                className={selectedMembers.length > 0 
                  ? "text-white/80 hover:text-white hover:bg-white/10" 
                  : "text-white/30 cursor-not-allowed"
                }
                onClick={selectedMembers.length > 0 ? handleNewBroadcast : undefined}
                disabled={selectedMembers.length === 0}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message {selectedMembers.length > 0 ? `(${selectedMembers.length})` : ''}
              </CustomButton>
              <CustomButton 
                variant="rounded-rect" 
                className={selectedMembers.length > 0 
                  ? "text-white/80 hover:text-white hover:bg-white/10" 
                  : "text-white/30 cursor-not-allowed"
                }
                onClick={selectedMembers.length > 0 ? () => {
                  setIsEmailDialogOpen(true);
                } : undefined}
                disabled={selectedMembers.length === 0}
              >
                <Mail className="h-4 w-4 mr-2" />
                Send E-mail {selectedMembers.length > 0 ? `(${selectedMembers.length})` : ''}
              </CustomButton>
            </>
          }
        />
      )}
      <ListView
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        loading={loading}
        title="Broadcast"
        subtitle="Select members to send a message to."
        availableTags={availableTags}
        selectedTags={selectedTags}
        onToggleTag={handleToggleTag}
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
        />
      </ListView>
      
      <BroadcastDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        members={selectedMembers}
        templates={templates}
        loadingTemplates={loadingTemplates}
      />
      
      <EmailSendDialog
        isOpen={isEmailDialogOpen}
        onClose={() => setIsEmailDialogOpen(false)}
        members={selectedMembers}
        communityName={community?.name}
      />
    </div>
  );
}
