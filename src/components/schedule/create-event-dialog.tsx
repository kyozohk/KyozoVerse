'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Users, Loader2, Calendar, MapPin, Clock, Image as ImageIcon, X, Upload, ChevronDown, Plus } from 'lucide-react';
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

interface CreateEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  members: MemberData[];
  communityId: string;
  communityName?: string;
  onEventCreated?: (event: any) => void;
  initialDate?: string;
}

export function CreateEventDialog({
  isOpen,
  onClose,
  members,
  communityId,
  communityName,
  onEventCreated,
  initialDate,
}: CreateEventDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Mode: 'select' for selecting existing guestlist, 'create' for creating new
  const [mode, setMode] = useState<'select' | 'create'>('select');
  
  // Existing guestlists
  const [guestlists, setGuestlists] = useState<Guestlist[]>([]);
  const [loadingGuestlists, setLoadingGuestlists] = useState(true);
  const [selectedGuestlistId, setSelectedGuestlistId] = useState<string>('');
  
  // New guestlist creation
  const [selectedMembers, setSelectedMembers] = useState<MemberData[]>([]);
  const [newGuestlistName, setNewGuestlistName] = useState('');
  
  // Event details
  const [eventName, setEventName] = useState('');
  const [startDate, setStartDate] = useState(initialDate || '');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [description, setDescription] = useState('');
  const [eventImage, setEventImage] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Update dates when initialDate changes
  useEffect(() => {
    if (initialDate) {
      setStartDate(initialDate);
      setEndDate(initialDate);
    }
  }, [initialDate]);

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

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'x-user-id': user?.uid || '' },
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

    if (mode === 'select' && !selectedGuestlistId) {
      toast({ title: 'No Guestlist Selected', description: 'Please select a guestlist or create a new one.', variant: 'destructive' });
      return;
    }

    if (mode === 'create' && selectedMembers.length === 0) {
      toast({ title: 'No Members Selected', description: 'Please select at least one member for the guestlist.', variant: 'destructive' });
      return;
    }

    if (mode === 'create' && !newGuestlistName.trim()) {
      toast({ title: 'Missing Guestlist Name', description: 'Please enter a name for the new guestlist.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    
    try {
      if (mode === 'select') {
        // Create new event linked to existing guestlist
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
      } else {
        // Create new guestlist with event details
        const guestlistData = {
          name: newGuestlistName.trim(),
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
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, 'guestlists'), guestlistData);
        toast({ title: 'Event Created', description: `Event "${eventName}" created with ${selectedMembers.length} guests.` });
        onEventCreated?.({ id: docRef.id, ...guestlistData });
      }
      
      handleClose();
    } catch (error) {
      console.error('Failed to create event:', error);
      toast({ title: 'Failed to Create', description: 'Failed to create event. Please try again.', variant: 'destructive' });
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
    setMode('select');
    setSelectedGuestlistId('');
    setSelectedMembers([]);
    setNewGuestlistName('');
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

  const selectedGuestlist = guestlists.find(g => g.id === selectedGuestlistId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[850px] max-h-[90vh] p-0 overflow-hidden" style={{ backgroundColor: '#F5F0E8' }}>
        <div className="flex h-[70vh]">
          {/* Left Panel - Event Details */}
          <div className="flex-1 flex flex-col border-r" style={{ borderColor: '#E8DFD1' }}>
            <DialogHeader className="p-6 pb-4">
              <DialogTitle style={{ color: '#5B4A3A' }}>Create Event</DialogTitle>
              <DialogDescription>
                Schedule an event and assign a guestlist
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

              {/* Guestlist Selection */}
              <div className="mb-4">
                <Label className="text-sm font-medium mb-2 block" style={{ color: '#5B4A3A' }}>
                  Guestlist <span className="text-red-500">*</span>
                </Label>
                
                {loadingGuestlists ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#8B7355' }} />
                  </div>
                ) : (
                  <>
                    {/* Horizontal scrolling guestlist cards */}
                    <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                      {guestlists.map((gl) => (
                        <button
                          key={gl.id}
                          type="button"
                          onClick={() => {
                            setMode('select');
                            setSelectedGuestlistId(gl.id);
                          }}
                          className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                            mode === 'select' && selectedGuestlistId === gl.id
                              ? 'border-2 shadow-sm'
                              : 'hover:border-2 hover:shadow-sm'
                          }`}
                          style={{
                            backgroundColor: mode === 'select' && selectedGuestlistId === gl.id ? '#E8DFD1' : 'white',
                            borderColor: mode === 'select' && selectedGuestlistId === gl.id ? '#5B4A3A' : '#E8DFD1',
                          }}
                        >
                          {/* Member avatars - show first 3 */}
                          <div className="flex -space-x-2">
                            {gl.members.slice(0, 3).map((member: any, idx: number) => (
                              <RoundImage
                                key={member.id || idx}
                                src={member.imageUrl || ''}
                                alt={member.name || 'Guest'}
                                size={24}
                                border={true}
                                borderColor="white"
                                borderWidth={1}
                              />
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
                      
                      {/* Create New button */}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('create');
                          setSelectedGuestlistId('');
                        }}
                        className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                          mode === 'create'
                            ? 'border-2 shadow-sm bg-white'
                            : 'border-dashed hover:border-solid hover:shadow-sm'
                        }`}
                        style={{ borderColor: mode === 'create' ? '#5B4A3A' : '#E8DFD1' }}
                      >
                        <Plus className="h-4 w-4" style={{ color: '#8B7355' }} />
                        <span className="text-xs" style={{ color: '#8B7355' }}>Create New</span>
                      </button>
                    </div>

                    {/* New guestlist name input */}
                    {mode === 'create' && (
                      <div className="mt-3">
                        <Label className="text-sm" style={{ color: '#8B7355' }}>New Guestlist Name</Label>
                        <Input
                          placeholder="e.g., VIP Launch Party..."
                          value={newGuestlistName}
                          onChange={(e) => setNewGuestlistName(e.target.value)}
                          style={{ backgroundColor: 'white', borderColor: '#E8DFD1' }}
                        />
                        <p className="text-xs mt-1" style={{ color: '#8B7355' }}>
                          Select members from the right panel →
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

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
                disabled={isSaving || !eventName.trim() || (mode === 'select' && !selectedGuestlistId) || (mode === 'create' && (selectedMembers.length === 0 || !newGuestlistName.trim()))}
                style={{ backgroundColor: '#E8DFD1', color: '#5B4A3A', border: 'none' }}
              >
                {isSaving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                ) : (
                  <><Calendar className="mr-2 h-4 w-4" /> Create Event</>
                )}
              </Button>
            </div>
          </div>

          {/* Right Panel - Member Selection (only when creating new guestlist) */}
          {mode === 'create' && (
            <div className="w-[600px] flex flex-col" style={{ backgroundColor: '#FAF8F5' }}>
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
  );
}
