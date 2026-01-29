'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Users, Loader2, Calendar, MapPin, Clock, Image as ImageIcon, X, Upload } from 'lucide-react';
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

interface CreateGuestlistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  members: MemberData[];
  communityId: string;
  communityName?: string;
  onGuestlistCreated?: (guestlist: any) => void;
}

export function CreateGuestlistDialog({
  isOpen,
  onClose,
  members,
  communityId,
  communityName,
  onGuestlistCreated,
}: CreateGuestlistDialogProps) {
  const { toast } = useToast();
  const [selectedMembers, setSelectedMembers] = useState<MemberData[]>([]);
  const [guestlistName, setGuestlistName] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [description, setDescription] = useState('');
  const [eventImage, setEventImage] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please select an image file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please select an image under 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setEventImage(data.url);
      
      toast({
        title: 'Image Uploaded',
        description: 'Event image uploaded successfully.',
      });
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = () => {
    setEventImage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreateGuestlist = async () => {
    if (!guestlistName.trim()) {
      toast({
        title: 'Missing Name',
        description: 'Please enter a guestlist name.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedMembers.length === 0) {
      toast({
        title: 'No Members Selected',
        description: 'Please select at least one member for the guestlist.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    
    try {
      const guestlistData = {
        name: guestlistName.trim(),
        eventName: eventName.trim() || null,
        eventDate: eventDate || null,
        eventTime: eventTime || null,
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
          status: 'invited', // invited, confirmed, declined, checked-in
          addedAt: new Date().toISOString(),
        })),
        memberCount: selectedMembers.length,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'guestlists'), guestlistData);
      
      toast({
        title: 'Guestlist Created',
        description: `"${guestlistName}" created with ${selectedMembers.length} guest${selectedMembers.length === 1 ? '' : 's'}.`,
      });
      
      if (onGuestlistCreated) {
        onGuestlistCreated({ id: docRef.id, ...guestlistData });
      }
      
      // Reset form
      setGuestlistName('');
      setEventName('');
      setEventDate('');
      setEventTime('');
      setEventLocation('');
      setEventImage('');
      setDescription('');
      setSelectedMembers([]);
      
      onClose();
    } catch (error) {
      console.error('Failed to create guestlist:', error);
      toast({
        title: 'Failed to Create',
        description: 'Failed to create guestlist. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const onSelectionChange = useCallback((ids: Set<string>, items: MemberData[]) => {
    setSelectedMembers(items);
  }, []);

  const handleClose = () => {
    setGuestlistName('');
    setEventName('');
    setEventDate('');
    setEventTime('');
    setEventLocation('');
    setEventImage('');
    setDescription('');
    setSelectedMembers([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[1200px] max-h-[90vh] p-0 overflow-hidden" style={{ backgroundColor: '#F5F0E8' }}>
        <div className="flex h-[80vh]">
          {/* Left Panel - Guestlist Details */}
          <div className="flex-1 flex flex-col border-r" style={{ borderColor: '#E8DFD1' }}>
            <DialogHeader className="p-6 pb-4">
              <DialogTitle style={{ color: '#5B4A3A' }}>Create Guestlist</DialogTitle>
              <DialogDescription>
                Create a new guestlist and add members to it
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6">
              {/* Guestlist Name */}
              <div className="mb-4">
                <Label htmlFor="guestlistName" style={{ color: '#5B4A3A' }}>
                  Guestlist Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="guestlistName"
                  placeholder="e.g., VIP Launch Party, Summer Event 2026..."
                  value={guestlistName}
                  onChange={(e) => setGuestlistName(e.target.value)}
                  style={{ backgroundColor: 'white', borderColor: '#E8DFD1' }}
                />
              </div>

              {/* Event Details Section */}
              <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: '#FAF8F5', border: '1px solid #E8DFD1' }}>
                <h4 className="text-sm font-medium mb-3" style={{ color: '#5B4A3A' }}>
                  Event Details (Optional)
                </h4>
                
                {/* Event Name */}
                <div className="mb-3">
                  <Label htmlFor="eventName" className="text-sm" style={{ color: '#8B7355' }}>
                    Event Name
                  </Label>
                  <Input
                    id="eventName"
                    placeholder="e.g., Annual Gala, Product Launch..."
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    style={{ backgroundColor: 'white', borderColor: '#E8DFD1' }}
                  />
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <Label htmlFor="eventDate" className="text-sm flex items-center gap-1" style={{ color: '#8B7355' }}>
                      <Calendar className="h-3 w-3" /> Date
                    </Label>
                    <Input
                      id="eventDate"
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      style={{ backgroundColor: 'white', borderColor: '#E8DFD1' }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="eventTime" className="text-sm flex items-center gap-1" style={{ color: '#8B7355' }}>
                      <Clock className="h-3 w-3" /> Time
                    </Label>
                    <Input
                      id="eventTime"
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      style={{ backgroundColor: 'white', borderColor: '#E8DFD1' }}
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="mb-3">
                  <Label htmlFor="eventLocation" className="text-sm flex items-center gap-1" style={{ color: '#8B7355' }}>
                    <MapPin className="h-3 w-3" /> Location
                  </Label>
                  <Input
                    id="eventLocation"
                    placeholder="e.g., The Grand Ballroom, 123 Main St..."
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    style={{ backgroundColor: 'white', borderColor: '#E8DFD1' }}
                  />
                </div>

                {/* Event Image */}
                <div>
                  <Label className="text-sm flex items-center gap-1" style={{ color: '#8B7355' }}>
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
              </div>

              {/* Description */}
              <div className="mb-4">
                <Label htmlFor="description" style={{ color: '#5B4A3A' }}>Description</Label>
                <Textarea
                  id="description"
                  placeholder="Add notes or description for this guestlist..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  style={{ backgroundColor: 'white', borderColor: '#E8DFD1' }}
                />
              </div>

              {/* Selected Members Summary */}
              <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: '#E8DFD1' }}>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" style={{ color: '#5B4A3A' }} />
                  <span className="font-medium" style={{ color: '#5B4A3A' }}>
                    {selectedMembers.length} Guest{selectedMembers.length === 1 ? '' : 's'} Selected
                  </span>
                </div>
                {selectedMembers.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedMembers.slice(0, 5).map((member) => (
                      <span
                        key={member.id}
                        className="text-xs px-2 py-1 rounded-full"
                        style={{ backgroundColor: '#5B4A3A', color: 'white' }}
                      >
                        {member.name}
                      </span>
                    ))}
                    {selectedMembers.length > 5 && (
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{ backgroundColor: '#8B7355', color: 'white' }}
                      >
                        +{selectedMembers.length - 5} more
                      </span>
                    )}
                  </div>
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
              <Button
                onClick={handleCreateGuestlist}
                disabled={isSaving || selectedMembers.length === 0 || !guestlistName.trim()}
                style={{ backgroundColor: '#E07B39', color: 'white' }}
              >
                {isSaving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                ) : (
                  <><Users className="mr-2 h-4 w-4" /> Create Guestlist</>
                )}
              </Button>
            </div>
          </div>

          {/* Right Panel - Member Selection */}
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
                renderGridItem={(item, isSelected, onSelect, urlField, selectable) => (
                  <MemberGridItem item={item} isSelected={isSelected} selectable={selectable} />
                )}
                renderListItem={(item, isSelected, onSelect, urlField, selectable) => (
                  <MemberListItem item={item} isSelected={isSelected} selectable={selectable} />
                )}
                renderCircleItem={(item, isSelected, onSelect, urlField, selectable) => (
                  <MemberCircleItem item={item} isSelected={isSelected} selectable={selectable} />
                )}
                searchKeys={['name', 'email', 'tags']}
                selectable={true}
                onSelectionChange={onSelectionChange}
                defaultViewMode="list"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
