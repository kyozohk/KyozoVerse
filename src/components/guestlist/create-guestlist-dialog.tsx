'use client';

import React, { useState } from 'react';
import { Users, Loader2, X, Search } from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/firebase/firestore';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface MemberData {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  imageUrl: string;
  role?: string;
  joinedDate?: any;
  tags?: string[];
}

interface GuestlistMember {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  imageUrl?: string;
  tags?: string[];
}

interface ExistingGuestlist {
  id: string;
  name: string;
  members: GuestlistMember[];
}

interface CreateGuestlistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  members: MemberData[];
  communityId: string;
  communityName?: string;
  onGuestlistCreated?: (guestlist: any) => void;
  existingGuestlist?: ExistingGuestlist | null;
  isRsvp?: boolean;
}

export function CreateGuestlistDialog({
  isOpen,
  onClose,
  members,
  communityId,
  communityName,
  onGuestlistCreated,
  existingGuestlist,
  isRsvp = false,
}: CreateGuestlistDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const getInitialMembers = () => {
    if (!existingGuestlist?.members?.length) return [];
    const existingIds = new Set(existingGuestlist.members.map(m => m.userId));
    return members.filter(m => existingIds.has(m.userId));
  };

  const [selectedMembers, setSelectedMembers] = useState<MemberData[]>(getInitialMembers);
  const [guestlistName, setGuestlistName] = useState(existingGuestlist?.name || '');
  const [memberSearch, setMemberSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const filteredMembers = members.filter(m => {
    if (selectedMembers.some(s => s.id === m.id)) return false;
    if (!memberSearch.trim()) return true;
    const q = memberSearch.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      (m.email || '').toLowerCase().includes(q) ||
      (m.tags || []).some(t => t.toLowerCase().includes(q))
    );
  });

  const addMember = (member: MemberData) => {
    setSelectedMembers(prev => [...prev, member]);
    setMemberSearch('');
  };

  const removeMember = (memberId: string) => {
    setSelectedMembers(prev => prev.filter(m => m.id !== memberId));
  };

  const handleSave = async () => {
    if (!guestlistName.trim()) {
      toast({ title: 'Missing Name', description: `Please enter a ${isRsvp ? 'RSVP' : 'guestlist'} name.`, variant: 'destructive' });
      return;
    }
    if (selectedMembers.length === 0) {
      toast({ title: 'No Members', description: 'Please add at least one member.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const collection_name = isRsvp ? 'rsvps' : 'guestlists';
      const guestlistData: any = {
        name: guestlistName.trim(),
        communityId,
        type: isRsvp ? 'rsvp' : 'guestlist',
        members: selectedMembers.map(m => ({
          id: m.id,
          userId: m.userId,
          name: m.name,
          email: m.email || null,
          phone: m.phone || null,
          imageUrl: m.imageUrl,
          tags: m.tags || [],
          rsvpStatus: isRsvp ? 'pending' : 'invited',
          addedAt: new Date().toISOString(),
        })),
        memberCount: selectedMembers.length,
        updatedAt: serverTimestamp(),
      };

      if (existingGuestlist) {
        const idToken = await user?.getIdToken();
        const endpoint = isRsvp ? '/api/rsvps/update' : '/api/guestlists/update';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
          body: JSON.stringify({ guestlistId: existingGuestlist.id, data: guestlistData }),
        });
        if (!res.ok) throw new Error(await res.text());
        toast({ title: `${isRsvp ? 'RSVP' : 'Guestlist'} Updated`, description: `"${guestlistName}" updated with ${selectedMembers.length} member${selectedMembers.length === 1 ? '' : 's'}.` });
      } else {
        const docRef = await addDoc(collection(db, collection_name), { ...guestlistData, createdAt: serverTimestamp() });
        toast({ title: `${isRsvp ? 'RSVP' : 'Guestlist'} Created`, description: `"${guestlistName}" created with ${selectedMembers.length} member${selectedMembers.length === 1 ? '' : 's'}.` });
        if (onGuestlistCreated) onGuestlistCreated({ id: docRef.id, ...guestlistData });
      }

      setGuestlistName('');
      setSelectedMembers([]);
      setMemberSearch('');
      onClose();
    } catch (error) {
      console.error('Failed to save:', error);
      toast({ title: 'Error', description: `Failed to ${existingGuestlist ? 'update' : 'create'}. Please try again.`, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setGuestlistName('');
    setSelectedMembers([]);
    setMemberSearch('');
    onClose();
  };

  const title = isRsvp
    ? (existingGuestlist ? 'Edit RSVP' : 'Create RSVP')
    : (existingGuestlist ? 'Edit Guestlist' : 'Create Guestlist');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] flex flex-col p-0 overflow-hidden" style={{ backgroundColor: '#F5F0E8', '--page-bg-color': '#F5F0E8' } as React.CSSProperties}>
        <DialogHeader className="p-6 pb-4 border-b" style={{ borderColor: '#E8DFD1' }}>
          <DialogTitle style={{ color: '#5B4A3A' }}>{title}</DialogTitle>
          <DialogDescription>
            {isRsvp
              ? (existingGuestlist ? 'Update RSVP list and members' : 'Create an RSVP list — members will receive a confirmation email')
              : (existingGuestlist ? 'Update guestlist name and members' : 'Create a guestlist and add community members')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <Input
              label={`${isRsvp ? 'RSVP Name' : 'Guestlist Name'} *`}
              value={guestlistName}
              onChange={(e) => setGuestlistName(e.target.value)}
            />
          </div>

          {/* Member Tag Selector */}
          <div>
            <p className="text-sm font-medium mb-2" style={{ color: '#5B4A3A' }}>
              Members <span className="text-red-500">*</span>
            </p>

            {/* Selected member chips */}
            {selectedMembers.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5 p-3 rounded-lg min-h-[48px]" style={{ backgroundColor: '#EDE8DF', border: '1px solid #E8DFD1' }}>
                {selectedMembers.map(m => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1 text-sm px-2.5 py-1 rounded-full font-medium"
                    style={{ backgroundColor: '#5B4A3A', color: 'white' }}
                  >
                    {m.name}
                    <button
                      type="button"
                      onClick={() => removeMember(m.id)}
                      className="ml-0.5 rounded-full hover:bg-white/20 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search input */}
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: '#8B7355' }} />
              <Input
                placeholder="Search by name, email, or tag..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="pl-9"
                style={{ backgroundColor: 'white', borderColor: '#E8DFD1' }}
              />
            </div>

            {/* Filtered member list */}
            {(memberSearch.trim() || filteredMembers.length > 0) && (
              <div className="mt-1 rounded-lg overflow-hidden border" style={{ borderColor: '#E8DFD1', maxHeight: '220px', overflowY: 'auto' }}>
                {filteredMembers.length === 0 ? (
                  <p className="text-sm text-center py-4" style={{ color: '#8B7355' }}>
                    {memberSearch.trim() ? 'No members found' : 'All members already added'}
                  </p>
                ) : (
                  filteredMembers.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => addMember(m)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#EDE8DF] transition-colors border-b last:border-b-0"
                      style={{ borderColor: '#E8DFD1', backgroundColor: 'white' }}
                    >
                      <UserAvatar name={m.name} imageUrl={m.imageUrl && m.imageUrl !== '/default-avatar.png' ? m.imageUrl : null} size={32} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: '#5B4A3A' }}>{m.name}</p>
                        {m.email && <p className="text-xs truncate" style={{ color: '#8B7355' }}>{m.email}</p>}
                      </div>
                      {m.tags && m.tags.length > 0 && (
                        <div className="flex gap-1 flex-shrink-0">
                          {m.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#E8DFD1', color: '#5B4A3A' }}>{tag}</span>
                          ))}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}

            <p className="text-xs mt-1.5" style={{ color: '#8B7355' }}>
              {selectedMembers.length} member{selectedMembers.length === 1 ? '' : 's'} selected
            </p>
          </div>
        </div>

        <div className="p-6 pt-4 border-t flex justify-between items-center" style={{ borderColor: '#E8DFD1' }}>
          <Button variant="outline" onClick={handleClose} style={{ borderColor: '#E8DFD1', color: '#5B4A3A' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || selectedMembers.length === 0 || !guestlistName.trim()}
            style={{ backgroundColor: '#E07B39', color: 'white' }}
          >
            {isSaving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {existingGuestlist ? 'Saving...' : 'Creating...'}</>
            ) : (
              <><Users className="mr-2 h-4 w-4" /> {existingGuestlist ? 'Save Changes' : (isRsvp ? 'Create RSVP' : 'Create Guestlist')}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
