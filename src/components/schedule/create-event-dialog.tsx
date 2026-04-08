'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Users, Loader2, Calendar, MapPin, Image as ImageIcon, X, Upload, PlusCircle } from 'lucide-react';
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
import { RoundImage } from '@/components/ui/round-image';
import { CreateGuestlistDialog } from '@/components/guestlist/create-guestlist-dialog';

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

interface Guestlist {
  id: string;
  name: string;
  memberCount: number;
  members: any[];
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
}: CreateEventDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Existing guestlists for selection
  const [guestlists, setGuestlists] = useState<Guestlist[]>([]);
  const [loadingGuestlists, setLoadingGuestlists] = useState(true);
  const [selectedGuestlistId, setSelectedGuestlistId] = useState<string>('');

  // Members for edit mode
  const getInitialMembers = () => {
    if (!existingEvent?.members?.length) return [];
    const existingIds = new Set(existingEvent.members.map((m: any) => m.userId));
    return members.filter(m => existingIds.has(m.userId));
  };
  const [selectedMembers, setSelectedMembers] = useState<MemberData[]>(getInitialMembers);
  
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
  const [showCreateGuestlistDialog, setShowCreateGuestlistDialog] = useState(false);
  const [isSuspendedForGuestlist, setIsSuspendedForGuestlist] = useState(false);

  // Fetch existing guestlists
  useEffect(() => {
    if (!isOpen || !communityId) return;
    
    const fetchGuestlists = async () => {
      setLoadingGuestlists(true);
      try {
        const guestlistsQuery = query(
          collection(db, 'guestlists'),
          where('communityId', '==', communityId)
        );
        const snapshot = await getDocs(guestlistsQuery);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          memberCount: doc.data().memberCount || 0,
          members: doc.data().members || [],
        }));
        setGuestlists(data);
      } catch (error) {
        console.error('Error fetching guestlists:', error);
      } finally {
        setLoadingGuestlists(false);
      }
    };
    
    fetchGuestlists();
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
    if (value) {
      const [hours, minutes] = value.split(':').map(Number);
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
      
      const endTimeStr = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      setEndTime(endTimeStr);
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

      if (!response.ok) throw new Error('Upload failed');

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
        // Update existing event via API (bypasses Firestore security rules)
        const eventData = {
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
          members: selectedMembers.map(m => ({
            id: m.id,
            userId: m.userId,
            name: m.name,
            email: m.email || null,
            phone: m.phone || null,
            imageUrl: m.imageUrl,
            tags: m.tags || [],
            status: 'invited',
            addedAt: new Date().toISOString(),
          })),
          memberCount: selectedMembers.length,
        };
        const idToken = await user?.getIdToken();
        const res = await fetch('/api/guestlists/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
          body: JSON.stringify({ guestlistId: existingEvent.id, data: eventData }),
        });
        if (!res.ok) throw new Error(await res.text());
        toast({ title: 'Event Updated', description: `Event "${eventName}" has been updated.` });
      } else {
        // Create new event linked to selected guestlist
        const selectedGuestlist = guestlists.find(g => g.id === selectedGuestlistId);
        const eventData = {
          name: selectedGuestlist?.name || eventName.trim(),
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
          guestlistId: selectedGuestlistId,
          members: selectedGuestlist?.members || [],
          memberCount: selectedGuestlist?.memberCount || 0,
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
    onClose();
  };

  const handleCreateNewGuestlist = () => {
    setIsSuspendedForGuestlist(true);
    setShowCreateGuestlistDialog(true);
  };

  const handleGuestlistCreated = (guestlist: any) => {
    // Add the new guestlist to the list and auto-select it
    setGuestlists(prev => [{ id: guestlist.id, name: guestlist.name, memberCount: guestlist.memberCount || 0, members: guestlist.members || [] }, ...prev]);
    setSelectedGuestlistId(guestlist.id);
    setShowCreateGuestlistDialog(false);
    setIsSuspendedForGuestlist(false);
  };

  const handleGuestlistDialogClose = () => {
    setShowCreateGuestlistDialog(false);
    setIsSuspendedForGuestlist(false);
  };

  return (
    <>
    <Dialog open={isOpen && !isSuspendedForGuestlist} onOpenChange={handleClose}>
      <DialogContent className={`${existingEvent ? 'sm:max-w-[1200px]' : 'sm:max-w-[520px]'} max-h-[90vh] p-0 overflow-hidden`} style={{ backgroundColor: '#F5F0E8' }}>
        <div className="flex h-[70vh]">
          {/* Left Panel - Event Details (70% width in edit mode) */}
          <div className={`${existingEvent ? 'w-[70%]' : 'flex-1'} flex flex-col border-r`} style={{ borderColor: '#E8DFD1' }}>
            <DialogHeader className="p-6 pb-4">
              <DialogTitle style={{ color: '#5B4A3A' }}>{existingEvent ? 'Edit Event' : 'Create Event'}</DialogTitle>
              <DialogDescription>
                {existingEvent ? 'Update the event details and attendees' : 'Schedule an event and assign a guestlist'}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6">
              {/* Event Name */}
              <div className="mb-4">
                <Label htmlFor="eventName" style={{ color: '#5B4A3A' }}>
                  Event Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="eventName"
                  placeholder="e.g., Annual Gala, Product Launch..."
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  style={{ backgroundColor: 'white', borderColor: '#E8DFD1' }}
                />
              </div>

              {/* Guestlist Selection - only in create mode */}
              {!existingEvent && (
                <div className="mb-4">
                  <Label className="text-sm font-medium mb-2 block" style={{ color: '#5B4A3A' }}>
                    Guestlist <span className="text-red-500">*</span>
                  </Label>
                  {loadingGuestlists ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#8B7355' }} />
                    </div>
                  ) : guestlists.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <p className="text-sm" style={{ color: '#8B7355' }}>No guestlists yet.</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCreateNewGuestlist}
                        style={{ borderColor: '#E8DFD1', color: '#5B4A3A' }}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Create New Guestlist
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                      {guestlists.map((gl) => (
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
                            <p className="text-[10px]" style={{ color: '#8B7355' }}>{gl.memberCount} guests</p>
                          </div>
                        </button>
                      ))}
                      {/* Create New Guestlist button inline with guestlist chips */}
                      <button
                        type="button"
                        onClick={handleCreateNewGuestlist}
                        className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed transition-all hover:shadow-sm"
                        style={{ borderColor: '#E8DFD1', color: '#8B7355' }}
                      >
                        <PlusCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">New Guestlist</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Date/Time Section - Compact Layout */}
              <div className="mb-4 grid grid-cols-2 gap-4">
                {/* Start */}
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#FAF8F5', border: '1px solid #E8DFD1' }}>
                  <h4 className="text-xs font-medium mb-2" style={{ color: '#5B4A3A' }}>Start</h4>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        className="text-xs h-8"
                        style={{ backgroundColor: 'white', borderColor: '#E8DFD1' }}
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => handleStartTimeChange(e.target.value)}
                        className="text-xs h-8"
                        style={{ backgroundColor: 'white', borderColor: '#E8DFD1' }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* End */}
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#FAF8F5', border: '1px solid #E8DFD1' }}>
                  <h4 className="text-xs font-medium mb-2" style={{ color: '#5B4A3A' }}>End</h4>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate}
                        className="text-xs h-8"
                        style={{ backgroundColor: 'white', borderColor: '#E8DFD1' }}
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="text-xs h-8"
                        style={{ backgroundColor: 'white', borderColor: '#E8DFD1' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="mb-4">
                <Label className="text-sm flex items-center gap-1" style={{ color: '#5B4A3A' }}>
                  <MapPin className="h-3 w-3" /> Location
                </Label>
                <Input
                  placeholder="e.g., The Grand Ballroom, 123 Main St..."
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  style={{ backgroundColor: 'white', borderColor: '#E8DFD1' }}
                />
              </div>

              {/* Event Image */}
              <div className="mb-4">
                <Label className="text-sm flex items-center gap-1" style={{ color: '#5B4A3A' }}>
                  <ImageIcon className="h-3 w-3" /> Event Image
                </Label>
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

              {/* Description */}
              <div className="mb-4">
                <Label style={{ color: '#5B4A3A' }}>Description</Label>
                <Textarea
                  placeholder="Add notes or description for this event..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  style={{ backgroundColor: 'white', borderColor: '#E8DFD1' }}
                />
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

          {/* Right Panel - Member Selection (edit mode only, 30% width) */}
          {existingEvent && (
            <div className="w-[30%] flex flex-col" style={{ backgroundColor: '#FAF8F5' }}>
              <div className="p-4 border-b" style={{ borderColor: '#E8DFD1' }}>
                <h3 className="font-medium" style={{ color: '#5B4A3A' }}>Add Guests</h3>
                <p className="text-sm text-muted-foreground">
                  Search by name or tags to add members to this guestlist
                </p>
              </div>
              <div className="flex-1 overflow-y-auto">
                <EnhancedListView
                  items={members}
                  searchKeys={['name', 'email'] as (keyof MemberData)[]}
                  selectable={true}
                  onSelectionChange={onSelectionChange}
                  selection={new Set(selectedMembers.map(m => m.id))}
                  renderGridItem={(item, isSelected, onSelect, urlField, selectable) => (
                    <div onClick={onSelect}>
                      <MemberGridItem item={item} isSelected={isSelected} selectable={selectable} />
                    </div>
                  )}
                  renderListItem={(item, isSelected, onSelect, urlField, selectable) => (
                    <div onClick={onSelect}>
                      <MemberListItem item={item} isSelected={isSelected} selectable={selectable} />
                    </div>
                  )}
                  renderCircleItem={(item, isSelected, onSelect, urlField, selectable) => (
                    <div onClick={onSelect}>
                      <MemberCircleItem item={item} isSelected={isSelected} selectable={selectable} />
                    </div>
                  )}
                  defaultViewMode="list"
                />
              </div>
              
              {/* Selected count */}
              <div className="p-4 border-t" style={{ borderColor: '#E8DFD1', backgroundColor: '#E8DFD1' }}>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" style={{ color: '#5B4A3A' }} />
                  <span className="font-medium" style={{ color: '#5B4A3A' }}>
                    {selectedMembers.length} Guest{selectedMembers.length === 1 ? '' : 's'} Selected
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>

      {/* Nested Create Guestlist Dialog */}
      <CreateGuestlistDialog
        isOpen={showCreateGuestlistDialog}
        onClose={handleGuestlistDialogClose}
        members={members}
        communityId={communityId}
        communityName={communityName}
        onGuestlistCreated={handleGuestlistCreated}
      />
    </>
  );
}
