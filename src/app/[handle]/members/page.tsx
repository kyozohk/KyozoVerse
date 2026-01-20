
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
  arrayUnion,
  arrayRemove,
  deleteDoc
} from "firebase/firestore";
import { db } from "@/firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { type Community, type User } from "@/lib/types";
import { getUserRoleInCommunity, getCommunityByHandle, getCommunityMembers } from "@/lib/community-utils";
import { MemberDialog } from "@/components/community/member-dialog";
import { CommunityMember } from "@/lib/types";
import { TagMembersDialog } from "@/components/community/tag-members-dialog";
import { RemoveTagDialog } from "@/components/community/remove-tag-dialog";
import { addTagsToCommunity, getCommunityTags, type CommunityTag } from "@/lib/community-tags";
import { InviteMemberDialog } from "@/components/community/invite-member-dialog";
import { ImportMembersDialog } from "@/components/community/import-members-dialog";
import { UserPlus, Mail, Upload, Plus, Tag, Search, List, LayoutGrid, ChevronDown, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage, Checkbox, Skeleton, Input } from "@/components/ui";
import { format } from 'date-fns';

// A simple debounce hook
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
  const router = useRouter();
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
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // State for remove tag confirmation
  const [tagToRemove, setTagToRemove] = useState<{ memberId: string; tag: string } | null>(null);
  const [isRemoveTagDialogOpen, setIsRemoveTagDialogOpen] = useState(false);
  
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
    setIsDeleteConfirmOpen(false);
    try {
      await deleteDoc(doc(db, 'communityMembers', memberToDelete.id));
      await updateDoc(doc(db, 'communities', community.communityId), {
        memberCount: increment(-1),
      });
      fetchMembers(); // Re-fetch members
      toast({ title: 'Member removed' });
    } catch (error) {
      toast({ title: 'Error removing member', variant: 'destructive' });
    } finally {
      setMemberToDelete(null);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Audience</h1>
          <p className="text-muted-foreground mt-1">Browse and manage your community audience.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsAddMemberOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
          <Button variant="outline" onClick={() => setIsInviteDialogOpen(true)}>
            <Mail className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import Member
          </Button>
        </div>
      </div>

      <div className="border rounded-lg bg-card p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-sm uppercase text-muted-foreground">Total Audience Overview</h3>
            <p className="text-xs text-muted-foreground">Breakdown of your community reach</p>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">6</p>
              <p className="text-xs text-muted-foreground">Members</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-500">5</p>
              <p className="text-xs text-muted-foreground">Contacts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">11</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <div className="flex justify-between items-center gap-4">
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
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button style={{ backgroundColor: '#843484', color: 'white' }} onClick={() => setIsTaggingOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create / Edit Tag
          </Button>
          <div className="flex items-center gap-1 rounded-md bg-muted p-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <List className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <LayoutGrid className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
        ) : (
          filteredMembers.map((member) => (
            <div key={member.id} className="grid grid-cols-[auto_40px_1fr_1fr_1fr_1fr_1fr] items-center gap-4 p-2 border bg-card rounded-lg hover:bg-muted/50 transition-colors">
              <Checkbox 
                checked={selectedMembers.some(m => m.id === member.id)}
                onCheckedChange={() => handleToggleMemberSelection(member)}
                className="ml-2"
              />
              <Avatar className="h-9 w-9">
                <AvatarImage src={member.userDetails?.avatarUrl} />
                <AvatarFallback>{member.userDetails?.displayName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-foreground">{member.userDetails?.displayName}</div>
                <div className="text-sm text-muted-foreground">{member.userDetails?.email}</div>
              </div>
              <div>
                <Badge variant={member.status === 'active' ? 'default' : 'destructive'} className="bg-green-100 text-green-800">Active</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Joined {member.joinedAt ? format(member.joinedAt.toDate(), 'MMM dd, yyyy') : '-'}
              </div>
              <div className="text-sm text-muted-foreground">
                {member.tags && member.tags.length > 0 ? member.tags.join(', ') : 'No tags'}
              </div>
            </div>
          ))
        )}
      </div>

      {isTaggingOpen && community && (
        <TagMembersDialog
          isOpen={isTaggingOpen}
          onClose={() => setIsTaggingOpen(false)}
          members={selectedMembers}
          communityId={community.communityId}
          onApplyTags={async (tagsToAdd, tagsToRemove) => {
            // This logic can be expanded
            console.log('Applying tags', { tagsToAdd, tagsToRemove });
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
          onSubmit={async () => {
            // Implement add logic
            fetchMembers();
          }}
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

      {/* Floating Buttons */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-50">
        <Button variant="default" className="rounded-full w-14 h-14 shadow-lg" style={{backgroundColor: '#E53935'}}>
          <Plus className="h-6 w-6" />
        </Button>
        <Button variant="default" className="rounded-full w-14 h-14 shadow-lg bg-black text-white">
          ?
        </Button>
      </div>

    </div>
  );
}
