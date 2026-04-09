'use client';

import { useState } from 'react';
import { CustomFormDialog } from '@/components/ui/dialog';
import { CustomButton } from '@/components/ui/CustomButton';
import { Calendar, MapPin, Users, Edit, Trash2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { UserAvatar } from '@/components/ui/user-avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CalendarEvent {
  id: string;
  name: string;
  eventName?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  description?: string;
  eventImage?: string;
  memberCount: number;
  members: any[];
  createdAt: any;
  linkedListId?: string;
  linkedListType?: 'guestlist' | 'rsvp';
}

interface EventDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: () => void;
}

export function EventDetailDialog({ isOpen, onClose, event, onEdit, onDelete }: EventDetailDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!event) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const idToken = await user?.getIdToken();
      const res = await fetch('/api/guestlists/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ guestlistId: event.id }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'Event Deleted', description: `"${event.eventName || event.name}" has been deleted.` });
      setShowDeleteConfirm(false);
      onClose();
      onDelete?.();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({ title: 'Error', description: 'Failed to delete event.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <CustomFormDialog open={isOpen} onOpenChange={(open) => !open && onClose()} title={event.eventName || event.name} size="xl">
        <div className="space-y-6">
          {event.eventImage && (
            <div className="-mx-6 -mt-6 mb-2 overflow-hidden rounded-t-xl" style={{ height: '200px' }}>
              <img src={event.eventImage} alt={event.eventName || event.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="space-y-3">
            {event.eventDate && (
              <div className="flex items-center gap-2" style={{ color: '#5B4A3A' }}>
                <Calendar className="h-4 w-4" style={{ color: '#E07B39' }} />
                <span className="text-sm">{new Date(event.eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            )}
            {event.eventTime && (
              <div className="flex items-center gap-2" style={{ color: '#5B4A3A' }}>
                <Clock className="h-4 w-4" style={{ color: '#E07B39' }} />
                <span className="text-sm">{event.eventTime}</span>
              </div>
            )}
            {event.eventLocation && (
              <div className="flex items-center gap-2" style={{ color: '#5B4A3A' }}>
                <MapPin className="h-4 w-4" style={{ color: '#E07B39' }} />
                <span className="text-sm">{event.eventLocation}</span>
              </div>
            )}
          </div>

          {event.description && (
            <div>
              <h4 className="font-semibold mb-2" style={{ color: '#5B4A3A' }}>Description</h4>
              <p className="text-sm" style={{ color: '#6B5D52' }}>{event.description}</p>
            </div>
          )}

          {event.members && event.members.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4" style={{ color: '#E07B39' }} />
                <h4 className="font-semibold" style={{ color: '#5B4A3A' }}>Attendees ({event.memberCount})</h4>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {event.members.map((member: any) => (
                  <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: '#F9F6F1' }}>                    
                    <UserAvatar name={member.name || '?'} imageUrl={member.imageUrl} size={40} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" style={{ color: '#5B4A3A' }}>{member.name}</p>
                      {member.email && <p className="text-xs truncate" style={{ color: '#8B7355' }}>{member.email}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t" style={{ borderColor: '#E8DFD1' }}>
            <CustomButton variant="outline" onClick={() => { onEdit?.(event); onClose(); }} className="flex-1" style={{ borderColor: '#D8CFC0', color: '#5B4A3A' }}>
              <Edit className="h-4 w-4 mr-2" />Edit Event
            </CustomButton>
            <CustomButton variant="outline" onClick={() => setShowDeleteConfirm(true)} className="flex-1" style={{ borderColor: '#FCA5A5', color: '#DC2626' }}>
              <Trash2 className="h-4 w-4 mr-2" />Delete Event
            </CustomButton>
          </div>
        </div>
      </CustomFormDialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete "{event.eventName || event.name}"? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
