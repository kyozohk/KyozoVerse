
'use client';

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  collection, 
  query, 
  where,
  getDocs,
  doc, 
  updateDoc, 
  increment,
  deleteDoc
} from "firebase/firestore";
import { db } from "@/firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { type Community, type CommunityMember } from "@/lib/types";
import { getUserRoleInCommunity, getCommunityByHandle, getCommunityMembers } from "@/lib/community-utils";
import { MemberDialog } from "@/components/community/member-dialog";
import { TagMembersDialog } from "@/components/community/tag-members-dialog";
import { InviteMemberDialog } from "@/components/community/invite-member-dialog";
import { ImportMembersDialog } from "@/components/community/import-members-dialog";
import { UserPlus, Mail, Upload, Plus, Search, List, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage, Checkbox, Input, Badge } from '@/components/ui';
import { format } from 'date-fns';
import { MemberCard } from '@/components/community/member-card';
import { ItemsGrid } from '@/components/shared/items-grid';
import { cn } from "@/lib/utils";

function useDebounce(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

export default function CommunityMembersPage() {
  const { user } = useAuth();
  const params = useParams();
  const handle = params.handle as string;
  const { toast } = useToast();
  
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("guest");
  const [community, setCommunity] = useState<Community | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<CommunityMember | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<CommunityMember[]>([]);
  const [isTaggingOpen, setIsTaggingOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<CommunityMember | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [activeTab, setActiveTab] = useState('all');

  const fetchCommunityData = async () => {
    if (!handle) return;
    try {
      const communityData = await getCommunityByHandle(handle);
      if (communityData) {
        setCommunity(communityData);
        if (user) {
          const role = await getUserRoleInCommunity(user.uid, communityData.communityId);
          setUserRole(role);
        }
      }
    } catch (error) {
      console.error("Error fetching community data:", error);
    }
  };

  const fetchMembers = async () => {
    if (!community?.communityId) return;
    setLoading(true);
    try {
      const membersData = await getCommunityMembers(community.communityId);
      setMembers(membersData);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunityData();
  }, [handle, user]);

  useEffect(() => {
    if (community) {
      fetchMembers();
    }
  }, [community]);

  const handleToggleMemberSelection = (member: CommunityMember) => {
    setSelectedMembers((prevSelected) => {
      if (prevSelected.some(m => m.id === member.id)) {
        return prevSelected.filter(m => m.id !== member.id);
      } else {
        return [...prevSelected, member];
      }
    });
  };

  const filteredMembers = useMemo(() => {
    return members.filter(member => 
      member.userDetails?.displayName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      member.userDetails?.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [members, debouncedSearchTerm]);

  const handleDeleteMember = async () => {
    if (!memberToDelete || !community) return;
    try {
      await deleteDoc(doc(db, 'communityMembers', memberToDelete.id));
      await updateDoc(doc(db, 'communities', community.communityId), {
        memberCount: increment(-1),
      });
      fetchMembers();
      toast({ title: 'Member removed' });
    } catch (error) {
      toast({ title: 'Error removing member', variant: 'destructive' });
    } finally {
      setMemberToDelete(null);
    }
  };
  
  const renderMemberListItem = (member: CommunityMember) => (
    <div key={member.id} className="flex items-center gap-4 p-2 border bg-card rounded-lg hover:bg-muted/50 transition-colors w-full">
      <Checkbox 
        checked={selectedMembers.some(m => m.id === member.id)}
        onCheckedChange={() => handleToggleMemberSelection(member)}
        className="ml-2"
      />
      <Avatar className="h-9 w-9">
        <AvatarImage src={member.userDetails?.avatarUrl} />
        <AvatarFallback>{member.userDetails?.displayName?.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-grow">
        <div className="font-semibold text-foreground">{member.userDetails?.displayName}</div>
        <div className="text-sm text-muted-foreground">{member.userDetails?.email}</div>
      </div>
      <div className="w-24">
        <Badge variant={member.status === 'active' ? 'default' : 'destructive'} className="bg-green-100 text-green-800">Active</Badge>
      </div>
      <div className="text-sm text-muted-foreground w-40">
        Joined {member.joinedAt ? format(member.joinedAt.toDate(), 'MMM dd, yyyy') : '-'}
      </div>
      <div className="text-sm text-muted-foreground flex-grow">
        {member.tags && member.tags.length > 0 ? member.tags.join(', ') : 'No tags'}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Audience</h1>
          <p className="text-muted-foreground mt-1">Browse and manage your community audience.</p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <Button variant="outline" onClick={() => setIsAddMemberOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add
          </Button>
          <Button variant="outline" onClick={() => setIsInviteDialogOpen(true)}>
            <Mail className="h-4 w-4 mr-2" />
            Invite
          </Button>
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      <div className="bg-background/80 backdrop-blur-sm rounded-lg shadow-sm p-2 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
            <Button variant={activeTab === 'all' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveTab('all')}>All ({members.length})</Button>
            <Button variant={activeTab === 'members' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveTab('members')}>Members (6)</Button>
            <Button variant={activeTab === 'contacts' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveTab('contacts')}>Contacts (5)</Button>
          </div>
          <div className="relative flex-grow max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full bg-transparent border-0 focus-visible:ring-0"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button style={{ backgroundColor: '#843484', color: 'white' }} onClick={() => setIsTaggingOpen(true)} disabled={selectedMembers.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Tag
            </Button>
            <div className="flex items-center gap-1 rounded-md bg-muted p-1">
              <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('list')}>
                <List className="h-5 w-5" />
              </Button>
              <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('grid')}>
                <LayoutGrid className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        <ItemsGrid
          items={filteredMembers}
          isLoading={loading}
          renderItem={(member) => (
            viewMode === 'grid' ? (
              <MemberCard 
                  key={member.id}
                  member={member}
                  canManage={userRole === 'admin' || userRole === 'owner'}
                  onEdit={() => setEditingMember(member)}
                  onDelete={() => {
                      setMemberToDelete(member);
                  }}
                  selectable={true}
                  isSelected={selectedMembers.some(m => m.id === member.id)}
                  onSelect={() => handleToggleMemberSelection(member)}
              />
            ) : (
              renderMemberListItem(member)
            )
          )}
          gridClassName={cn(
            "grid gap-2",
            viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"
          )}
        />
      </div>

      {isTaggingOpen && community && (
        <TagMembersDialog
          isOpen={isTaggingOpen}
          onClose={() => setIsTaggingOpen(false)}
          members={selectedMembers}
          communityId={community.communityId}
          onApplyTags={async () => {
            setIsTaggingOpen(false);
            await fetchMembers();
          }}
        />
      )}

      {isInviteDialogOpen && community && (
        <InviteMemberDialog
          isOpen={isInviteDialogOpen}
          onClose={() => setIsInviteDialogOpen(false)}
          community={community}
        />
      )}

      {isAddMemberOpen && (
        <MemberDialog
          open={isAddMemberOpen}
          mode="add"
          communityName={community?.name}
          onClose={() => setIsAddMemberOpen(false)}
          onSubmit={fetchMembers}
        />
      )}
      
      {isImportDialogOpen && community && (
        <ImportMembersDialog
          isOpen={isImportDialogOpen}
          onClose={() => setIsImportDialogOpen(false)}
          community={community}
          onSuccess={fetchMembers}
        />
      )}

    </div>
  );
}
