'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Users, Loader2, Calendar, MapPin, Image as ImageIcon, X, Upload, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EnhancedListView } from '@/components/v2/enhanced-list-view';
import { MemberGridItem, MemberListItem, MemberCircleItem } from '@/components/v2/member-items';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/firebase/firestore';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { CreateGuestlistDialog } from '@/components/guestlist/create-guestlist-dialog';
import { RoundImage } from '@/components/ui/round-image';

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

interface LinkedList {
  id: string;
  name: string;
  memberCount: number;
  members: any[];
  type: 'guestlist' | 'rsvp';
}

interface ExistingEvent {
  id: string;
  name: string;
  eventName?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  description?: string;
  members: any[];
  eventImage?: string;
  linkedListId?: string;
  linkedListType?: 'guestlist' | 'rsvp';
}

interface CreateEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  members: MemberData[];
  communityId: string;
  communityName?: string;
  onEventCreated?: (event: any) => void;
  initialDate?: string;
  existingEvent?: ExistingEvent | null;
  defaultListType?: 'guestlist' | 'rsvp';
}

export function CreateEventDialog({
  isOpen,
  onClose,
  members,
  communityId,
  communityName,
  onEventCreated,
  initialDate,
  existingEvent,
  defaultListType = 'guestlist',
}: CreateEventDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // List selection state
  const [listType, setListType] = useState<'guestlist' | 'rsvp'>(defaultListType);
  const [guestlists, setGuestlists] = useState<LinkedList[]>([]);
  const [rsvpLists, setRsvpLists] = useState<LinkedList[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [selectedGuestlistId, setSelectedGuestlistId] = useState<string>('');
  const [showNewListDialog, setShowNewListDialog] = useState(false);

  // Members for edit mode
  const getInitialMembers = () => {
    if (!existingEvent?.members?.length) return [];
    const existingIds = new Set(existingEvent.members.map((m: any) => m.userId));
    return members.filter(m => existingIds.has(m.userId));
  };
  const [selectedMembers, setSelectedMembers] = useState<MemberData[]>(getInitialMembers);
  
  // Initialize selectedGuestlistId from linked list in edit mode
  useEffect(() => {
    if (existingEvent?.linkedListId) {
      setSelectedGuestlistId(existingEvent.linkedListId);
    }
  }, [existingEvent?.linkedListId]);
  
  // Event details
  const [eventName, setEventName] = useState(existingEvent?.eventName || existingEvent?.name || '');
  const [startDate, setStartDate] = useState(existingEvent?.eventDate || initialDate || '');
  const [startTime, setStartTime] = useState(existingEvent?.eventTime || '');
  const [endDate, setEndDate] = useState(existingEvent?.eventDate || initialDate || '');
  const [endTime, setEndTime] = useState('');
  const [eventLocation, setEventLocation] = useState(existingEvent?.eventLocation || '');
  const [description, setDescription] = useState(existingEvent?.description || '');
  const [eventImage, setEventImage] = useState<string>(existingEvent?.eventImage || '');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch guestlists + rsvps
  useEffect(() => {
    if (!isOpen || !communityId) return;
    const fetchLists = async () => {
      setLoadingLists(true);
      try {
        const [glSnap, rsvpSnap] = await Promise.all([
          getDocs(query(collection(db, 'guestlists'), where('communityId', '==', communityId))),
          getDocs(query(collection(db, 'rsvps'), where('communityId', '==', communityId))),
        ]);
        setGuestlists(glSnap.docs.map(d => ({ id: d.id, name: d.data().name, memberCount: d.data().memberCount || 0, members: d.data().members || [], type: 'guestlist' as const })));
        setRsvpLists(rsvpSnap.docs.map(d => ({ id: d.id, name: d.data().name, memberCount: d.data().memberCount || 0, members: d.data().members || [], type: 'rsvp' as const })));
      } catch (error) {
        console.error('Error fetching lists:', error);
      } finally {
        setLoadingLists(false);
      }
    };
    fetchLists();
  }, [isOpen, communityId]);

  // Update dates when initialDate changes (only for new events - no existingEvent)
  useEffect(() => {
    if (initialDate && !existingEvent) {
      setStartDate(initialDate);
      setEndDate(initialDate);
    }
  }, [initialDate, existingEvent]);

  // Auto-fill end date when start date changes
  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    if (!endDate || endDate < value) {
      setEndDate(value);
    }
  };

  // Auto-fill end time to 3 hours after start time
  const handleStartTimeChange = (value: string) => {
    setStartTime(value);
    // Only auto-fill end time if we have a complete time (HH:MM format)
    if (value && value.includes(':')) {
      const parts = value.split(':');
      if (parts.length === 2 && parts[0] && parts[1]) {
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        if (!isNaN(hours) && !isNaN(minutes)) {
          let endHours = hours + 3;
      let newEndDate = endDate || startDate;
      
          if (endHours >= 24) {
            endHours = endHours - 24;
            if (startDate) {
              const nextDay = new Date(startDate);
              nextDay.setDate(nextDay.getDate() + 1);
              newEndDate = nextDay.toISOString().split('T')[0];
              setEndDate(newEndDate);
            }
          }
          
          const endTimeStr = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
          setEndTime(endTimeStr);
        }
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid File', description: 'Please select an image file.', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File Too Large', description: 'Please select an image under 5MB.', variant: 'destructive' });
      return;
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('communityId', communityId);

      if (!user) {
        throw new Error('User not authenticated');
      }

      const idToken = await user.getIdToken();

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${idToken}` },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload error:', errorText);
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data = await response.json();
      setEventImage(data.url);
      toast({ title: 'Image Uploaded', description: 'Event image uploaded successfully.' });
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast({ title: 'Upload Failed', description: 'Failed to upload image. Please try again.', variant: 'destructive' });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = () => {
    setEventImage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreateEvent = async () => {
    // Validate
    if (!eventName.trim()) {
      toast({ title: 'Missing Event Name', description: 'Please enter an event name.', variant: 'destructive' });
      return;
    }

    if (!existingEvent && !selectedGuestlistId) {
      toast({ title: 'No Guestlist Selected', description: 'Please select a guestlist to link to this event.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    
    try {
      if (existingEvent) {
        // Determine linked list info and members
        const allLists = [...guestlists, ...rsvpLists];
        const linkedList = selectedGuestlistId ? allLists.find(l => l.id === selectedGuestlistId) : null;
        const linkedListType = linkedList?.type || existingEvent.linkedListType;
        
        // Update existing event via API (bypasses Firestore security rules)
        const eventData: Record<string, any> = {
          name: existingEvent.name || eventName.trim(),
          eventName: eventName.trim(),
          eventDate: startDate || null,
          eventTime: startTime || null,
          startDate: startDate || null,
          startTime: startTime || null,
          endDate: endDate || null,
          endTime: endTime || null,
          eventLocation: eventLocation.trim() || null,
          eventImage: eventImage || null,
          description: description.trim() || null,
        };
        // Update linked list if changed
        if (selectedGuestlistId && selectedGuestlistId !== existingEvent.linkedListId) {
          eventData.linkedListId = selectedGuestlistId;
          eventData.linkedListType = linkedListType;
          eventData.guestlistId = linkedListType === 'guestlist' ? selectedGuestlistId : null;
          eventData.rsvpId = linkedListType === 'rsvp' ? selectedGuestlistId : null;
          // Update members from the newly linked list
          if (linkedList) {
            eventData.members = linkedList.members;
            eventData.memberCount = linkedList.memberCount;
          }
        }
        const idToken = await user?.getIdToken();
        const res = await fetch('/api/guestlists/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
          body: JSON.stringify({ guestlistId: existingEvent.id, data: eventData }),
        });
        if (!res.ok) throw new Error(await res.text());
        toast({ title: 'Event Updated', description: `Event "${eventName}" has been updated.` });
      } else {
        // Create new event linked to selected list (guestlist or rsvp)
        const allLists = listType === 'rsvp' ? rsvpLists : guestlists;
        const selectedList = allLists.find(g => g.id === selectedGuestlistId);
        const eventData = {
          name: selectedList?.name || eventName.trim(),
          eventName: eventName.trim(),
          eventDate: startDate || null,
          eventTime: startTime || null,
          startDate: startDate || null,
          startTime: startTime || null,
          endDate: endDate || null,
          endTime: endTime || null,
          eventLocation: eventLocation.trim() || null,
          eventImage: eventImage || null,
          description: description.trim() || null,
          communityId,
          linkedListId: selectedGuestlistId,
          linkedListType: listType,
          guestlistId: listType === 'guestlist' ? selectedGuestlistId : null,
          rsvpId: listType === 'rsvp' ? selectedGuestlistId : null,
          members: selectedList?.members || [],
          memberCount: selectedList?.memberCount || 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, 'guestlists'), eventData);
        toast({ title: 'Event Created', description: `Event "${eventName}" has been scheduled.` });
        onEventCreated?.({ id: docRef.id, ...eventData });
      }
      
      handleClose();
    } catch (error) {
      console.error('Failed to save event:', error);
      toast({ title: existingEvent ? 'Failed to Update' : 'Failed to Create', description: `Failed to ${existingEvent ? 'update' : 'create'} event. Please try again.`, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const onSelectionChange = useCallback((ids: Set<string>, items: { id: string; tags?: string[] }[]) => {
    // Find full member data from the members array
    const selectedMemberData = members.filter(m => ids.has(m.id));
    setSelectedMembers(selectedMemberData);
  }, [members]);

  const handleClose = () => {
    setSelectedGuestlistId('');
    setSelectedMembers([]);
    setEventName('');
    setStartDate('');
    setStartTime('');
    setEndDate('');
    setEndTime('');
    setEventLocation('');
    setEventImage('');
    setDescription('');
    setListType(defaultListType);
    setShowNewListDialog(false);
    onClose();
  };

  const handleNewListCreated = (newList: any) => {
    const item: LinkedList = { id: newList.id, name: newList.name, memberCount: newList.memberCount || 0, members: newList.members || [], type: listType };
    if (listType === 'rsvp') {
      setRsvpLists(prev => [item, ...prev]);
    } else {
      setGuestlists(prev => [item, ...prev]);
    }
    setSelectedGuestlistId(newList.id);
    setShowNewListDialog(false);
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`${existingEvent ? 'sm:max-w-[1200px]' : 'sm:max-w-[700px]'} max-h-[90vh] p-0 overflow-hidden`} style={{ backgroundColor: '#F5F0E8', '--page-bg-color': '#F5F0E8' } as React.CSSProperties}>
        <div className="flex h-[80vh]">
          {/* Left Panel - Event Details (70% width in edit mode) */}
          <div className={`${existingEvent ? 'w-[70%]' : 'flex-1'} flex flex-col border-r`} style={{ borderColor: '#E8DFD1' }}>
            <DialogHeader className="p-6 pb-4">
              <DialogTitle className="text-2xl font-bold" style={{ color: '#5B4A3A' }}>{existingEvent ? 'Edit Event' : 'Create Event'}</DialogTitle>
              <DialogDescription style={{ color: '#8B7355' }}>
                {existingEvent ? 'Update the event details and attendees' : 'Schedule an event and assign a guestlist'}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6">
              {/* Event Name */}
              <div className="mb-4">
                <Input
                  label="Event Name *"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <Textarea
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {/* List Selection - only in create mode */}
              {!existingEvent && (
                <div className="mb-4">
                  {/* Guestlist / RSVP toggle */}
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium" style={{ color: '#5B4A3A' }}>
                      {listType === 'guestlist' ? 'Guestlist' : 'RSVP'} <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: '#E8DFD1' }}>
                      <button
                        type="button"
                        onClick={() => { setListType('guestlist'); setSelectedGuestlistId(''); }}
                        className="px-3 py-1 text-xs font-medium transition-colors"
                        style={listType === 'guestlist' ? { backgroundColor: '#5B4A3A', color: 'white' } : { backgroundColor: 'white', color: '#8B7355' }}
                      >
                        Guestlist
                      </button>
                      <button
                        type="button"
                        onClick={() => { setListType('rsvp'); setSelectedGuestlistId(''); }}
                        className="px-3 py-1 text-xs font-medium transition-colors"
                        style={listType === 'rsvp' ? { backgroundColor: '#E07B39', color: 'white' } : { backgroundColor: 'white', color: '#8B7355' }}
                      >
                        RSVP
                      </button>
                    </div>
                  </div>

                  {loadingLists ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#8B7355' }} />
                    </div>
                  ) : (
                    <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                      {(listType === 'guestlist' ? guestlists : rsvpLists).map((gl) => (
                        <button
                          key={gl.id}
                          type="button"
                          onClick={() => setSelectedGuestlistId(gl.id)}
                          className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                            selectedGuestlistId === gl.id ? 'border-2 shadow-sm' : 'hover:border-2 hover:shadow-sm'
                          }`}
                          style={{
                            backgroundColor: selectedGuestlistId === gl.id ? '#E8DFD1' : 'white',
                            borderColor: selectedGuestlistId === gl.id ? '#5B4A3A' : '#E8DFD1',
                          }}
                        >
                          <div className="flex -space-x-2">
                            {gl.members.slice(0, 3).map((member: any, idx: number) => (
                              <RoundImage key={member.id || idx} src={member.imageUrl || ''} alt={member.name || 'Guest'} size={24} border={true} borderColor="white" borderWidth={1} />
                            ))}
                            {gl.members.length === 0 && (
                              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                <Users className="h-3 w-3" style={{ color: '#8B7355' }} />
                              </div>
                            )}
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-medium" style={{ color: '#5B4A3A' }}>{gl.name}</p>
                            <p className="text-[10px]" style={{ color: '#8B7355' }}>{gl.memberCount} {listType === 'rsvp' ? 'invitees' : 'guests'}</p>
                          </div>
                        </button>
                      ))}

                      {/* Create new button */}
                      <button
                        type="button"
                        onClick={() => setShowNewListDialog(true)}
                        className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed transition-all hover:shadow-sm"
                        style={{ borderColor: '#D8CFC0', color: '#8B7355', backgroundColor: 'transparent' }}
                      >
                        <Plus className="h-4 w-4" />
                        <span className="text-xs font-medium">New {listType === 'rsvp' ? 'RSVP' : 'Guestlist'}</span>
                      </button>
                    </div>
                  )}

                  {!selectedGuestlistId && !loadingLists && (
                    <p className="text-xs mt-1" style={{ color: '#8B7355' }}>
                      Select or create a {listType === 'rsvp' ? 'RSVP list' : 'guestlist'} to link to this event.
                    </p>
                  )}
                </div>
              )}

              {/* KYPRO-23 / KYPRO-24: Date/Time fields are OPTIONAL in this form.
                  The Create button is only gated on Event Name and the selected
                  guestlist. Labels now say "(optional)" so users don't get stuck
                  trying to fight the browser's native picker thinking the times
                  are blocking submission. */}
              <div className="mb-4 grid grid-cols-2 gap-4">
                <Input
                  label="Start Date (optional)"
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                />
                <Input
                  label="Start Time (optional)"
                  type="time"
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                />
              </div>
              <div className="mb-4 grid grid-cols-2 gap-4">
                <Input
                  label="End Date (optional)"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                <Input
                  label="End Time (optional)"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>

              {/* Location */}
              <div className="mb-4">
                <Input
                  label="Location"
                  icon={<MapPin className="h-4 w-4" style={{ color: '#8B7355' }} />}
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                />
              </div>

              {/* Event Image */}
              <div className="mb-2">
                <p className="text-sm font-medium mb-2" style={{ color: '#5B4A3A' }}>
                  <ImageIcon className="h-3.5 w-3.5 inline mr-1" /> Event Image
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {eventImage ? (
                  <div className="relative mt-2">
                    <div 
                      className="h-32 rounded-lg bg-cover bg-center"
                      style={{ backgroundImage: `url(${eventImage})` }}
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="mt-2 w-full h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-white/50 transition-colors"
                    style={{ borderColor: '#E8DFD1', color: '#8B7355' }}
                  >
                    {isUploadingImage ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-6 w-6" />
                        <span className="text-sm">Click to upload image</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 pt-4 border-t flex justify-between items-center" style={{ borderColor: '#E8DFD1' }}>
              <Button
                variant="outline"
                onClick={handleClose}
                style={{ borderColor: '#E8DFD1', color: '#5B4A3A' }}
              >
                Cancel
              </Button>
              <div className="flex flex-col items-end gap-1">
                {!eventName.trim() && (
                  <p className="text-xs text-red-600">Event name is required</p>
                )}
                {!existingEvent && !selectedGuestlistId && eventName.trim() && (
                  <p className="text-xs text-red-600">Please select a guestlist or RSVP</p>
                )}
                <Button
                  onClick={handleCreateEvent}
                  disabled={isSaving || !eventName.trim() || (!existingEvent && !selectedGuestlistId)}
                  style={{ backgroundColor: '#E8DFD1', color: '#5B4A3A', border: 'none' }}
                >
                  {isSaving ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {existingEvent ? 'Saving...' : 'Creating...'}</>
                  ) : (
                    <><Calendar className="mr-2 h-4 w-4" /> {existingEvent ? 'Save Changes' : 'Create Event'}</>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Right Panel - Linked Guestlist (edit mode only, 30% width) */}
          {existingEvent && (
            <div className="w-[30%] flex flex-col" style={{ backgroundColor: '#FAF8F5' }}>
              <div className="p-4 border-b" style={{ borderColor: '#E8DFD1' }}>
                <h3 className="font-medium" style={{ color: '#5B4A3A' }}>Linked List</h3>
                <p className="text-xs mt-0.5" style={{ color: '#8B7355' }}>Change which guestlist or RSVP is linked to this event. To add/remove members, edit the list directly.</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {loadingLists ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#8B7355' }} />
                  </div>
                ) : (
                  <>
                    {/* Guestlists */}
                    {guestlists.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#B0A090' }}>Guestlists</p>
                        <div className="space-y-2">
                          {guestlists.map(gl => (
                            <button
                              key={gl.id}
                              type="button"
                              onClick={() => setSelectedGuestlistId(gl.id)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all"
                              style={{
                                backgroundColor: selectedGuestlistId === gl.id ? '#E8DFD1' : 'white',
                                borderColor: selectedGuestlistId === gl.id ? '#5B4A3A' : '#E8DFD1',
                                borderWidth: selectedGuestlistId === gl.id ? '2px' : '1px',
                              }}
                            >
                              <div className="flex -space-x-2 flex-shrink-0">
                                {gl.members.slice(0, 3).map((m: any, idx: number) => (
                                  <RoundImage key={m.id || idx} src={m.imageUrl || ''} alt={m.name || ''} size={24} border borderColor="white" borderWidth={1} />
                                ))}
                                {gl.members.length === 0 && (
                                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                    <Users className="h-3 w-3" style={{ color: '#8B7355' }} />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" style={{ color: '#5B4A3A' }}>{gl.name}</p>
                                <p className="text-xs" style={{ color: '#8B7355' }}>{gl.memberCount} guests</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* RSVP Lists */}
                    {rsvpLists.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#B0A090' }}>RSVP Lists</p>
                        <div className="space-y-2">
                          {rsvpLists.map(gl => (
                            <button
                              key={gl.id}
                              type="button"
                              onClick={() => setSelectedGuestlistId(gl.id)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all"
                              style={{
                                backgroundColor: selectedGuestlistId === gl.id ? '#FEF3EC' : 'white',
                                borderColor: selectedGuestlistId === gl.id ? '#E07B39' : '#E8DFD1',
                                borderWidth: selectedGuestlistId === gl.id ? '2px' : '1px',
                              }}
                            >
                              <div className="flex -space-x-2 flex-shrink-0">
                                {gl.members.slice(0, 3).map((m: any, idx: number) => (
                                  <RoundImage key={m.id || idx} src={m.imageUrl || ''} alt={m.name || ''} size={24} border borderColor="white" borderWidth={1} />
                                ))}
                                {gl.members.length === 0 && (
                                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                    <Users className="h-3 w-3" style={{ color: '#8B7355' }} />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" style={{ color: '#5B4A3A' }}>{gl.name}</p>
                                <p className="text-xs" style={{ color: '#E07B39' }}>{gl.memberCount} invitees</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {guestlists.length === 0 && rsvpLists.length === 0 && (
                      <p className="text-sm text-center py-8" style={{ color: '#B0A090' }}>No lists found</p>
                    )}
                  </>
                )}
              </div>
              {selectedGuestlistId && (
                <div className="p-4 border-t" style={{ borderColor: '#E8DFD1', backgroundColor: '#E8DFD1' }}>
                  <p className="text-xs font-medium" style={{ color: '#5B4A3A' }}>
                    Linked: {[...guestlists, ...rsvpLists].find(l => l.id === selectedGuestlistId)?.name || 'Selected'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* Inline create guestlist/rsvp dialog */}
    <CreateGuestlistDialog
      key={`new-${listType}`}
      isOpen={showNewListDialog}
      onClose={() => setShowNewListDialog(false)}
      members={members}
      communityId={communityId}
      communityName={communityName}
      onGuestlistCreated={handleNewListCreated}
      isRsvp={listType === 'rsvp'}
    />
    </>
  );
}
