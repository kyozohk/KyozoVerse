'use client';

import { useState } from 'react';
import { CustomFormDialog } from '@/components/ui/dialog';
import { CustomButton } from '@/components/ui/CustomButton';
import { Calendar, MapPin, Users, Edit, Trash2, Mail, Bell, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Button } from '@/components/ui/button';
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

interface GuestlistMember {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  imageUrl?: string;
  tags?: string[];
  rsvpStatus?: 'pending' | 'accepted';
  rsvpSentAt?: string;
  rsvpAcceptedAt?: string;
  status?: string;
}

interface Guestlist {
  id: string;
  name: string;
  eventName?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  description?: string;
  memberCount: number;
  members: GuestlistMember[];
  createdAt: any;
  tags?: string[];
  isRsvp?: boolean;
}

interface GuestlistDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  guestlist: Guestlist | null;
  onEdit?: (guestlist: Guestlist) => void;
  onDelete?: () => void;
}

export function GuestlistDetailDialog({
  isOpen,
  onClose,
  guestlist,
  onEdit,
  onDelete,
}: GuestlistDetailDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);

  // RSVP stats
  const rsvpMembers = guestlist?.members?.filter((m: any) => m.rsvpStatus) || [];
  const acceptedCount = rsvpMembers.filter((m: any) => m.rsvpStatus === 'accepted').length;
  const pendingCount = rsvpMembers.filter((m: any) => m.rsvpStatus === 'pending').length;
  const isRsvpGuestlist = guestlist?.isRsvp || rsvpMembers.length > 0;

  const handleSendReminders = async () => {
    if (!guestlist) return;
    setIsSendingReminder(true);
    try {
      const idToken = await user?.getIdToken();
      const res = await fetch('/api/rsvp/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ guestlistId: guestlist.id }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      toast({
        title: 'Reminders Sent',
        description: `Reminder emails sent to ${data.sentCount} guest${data.sentCount === 1 ? '' : 's'}.`
      });
    } catch (error) {
      console.error('Error sending reminders:', error);
      toast({ title: 'Error', description: 'Failed to send reminders.', variant: 'destructive' });
    } finally {
      setIsSendingReminder(false);
    }
  };

  if (!guestlist) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const idToken = await user?.getIdToken();
      const res = await fetch('/api/guestlists/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ guestlistId: guestlist.id }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'Guestlist Deleted', description: `"${guestlist.name}" has been deleted successfully.` });
      setShowDeleteConfirm(false);
      onClose();
      onDelete?.();
    } catch (error) {
      console.error('Error deleting guestlist:', error);
      toast({ title: 'Error', description: 'Failed to delete guestlist. Please try again.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <CustomFormDialog
        open={isOpen}
        onOpenChange={(open) => !open && onClose()}
        title={guestlist.name}
        description={guestlist.eventName || 'Guestlist Details'}
        size="xl"
      >
        <div className="space-y-6">
          {/* Event Details */}
          {(guestlist.eventDate || guestlist.eventLocation) && (
            <div className="space-y-3">
              {guestlist.eventDate && (
                <div className="flex items-center gap-2" style={{ color: '#5B4A3A' }}>
                  <Calendar className="h-4 w-4" style={{ color: '#E07B39' }} />
                  <span className="text-sm">
                    {new Date(guestlist.eventDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                    {guestlist.eventTime && ` at ${guestlist.eventTime}`}
                  </span>
                </div>
              )}
              {guestlist.eventLocation && (
                <div className="flex items-center gap-2" style={{ color: '#5B4A3A' }}>
                  <MapPin className="h-4 w-4" style={{ color: '#E07B39' }} />
                  <span className="text-sm">{guestlist.eventLocation}</span>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {guestlist.description && (
            <div>
              <h4 className="font-semibold mb-2" style={{ color: '#5B4A3A' }}>
                Description
              </h4>
              <p className="text-sm" style={{ color: '#6B5D52' }}>
                {guestlist.description}
              </p>
            </div>
          )}

          {/* RSVP Status Summary */}
          {isRsvpGuestlist && (
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#FAF8F5', border: '1px solid #E8DFD1' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" style={{ color: '#E07B39' }} />
                  <h4 className="font-semibold text-sm" style={{ color: '#5B4A3A' }}>RSVP Status</h4>
                </div>
                {pendingCount > 0 && (
                  <button
                    onClick={handleSendReminders}
                    disabled={isSendingReminder}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition-colors hover:opacity-80"
                    style={{ backgroundColor: '#E07B39', color: 'white' }}
                  >
                    {isSendingReminder ? (
                      <><span className="animate-spin">↻</span> Sending...</>
                    ) : (
                      <><Bell className="h-3 w-3" /> Remind ({pendingCount})</>
                    )}
                  </button>
                )}
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#4CAF50' }} />
                  <span className="text-sm" style={{ color: '#5B4A3A' }}>
                    <strong>{acceptedCount}</strong> Accepted
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FF9800' }} />
                  <span className="text-sm" style={{ color: '#5B4A3A' }}>
                    <strong>{pendingCount}</strong> Pending
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#9E9E9E' }} />
                  <span className="text-sm" style={{ color: '#5B4A3A' }}>
                    <strong>{guestlist.memberCount - rsvpMembers.length}</strong> No RSVP
                  </span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E8DFD1' }}>
                <div className="h-full flex">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${guestlist.memberCount > 0 ? (acceptedCount / guestlist.memberCount) * 100 : 0}%`,
                      backgroundColor: '#4CAF50'
                    }}
                  />
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${guestlist.memberCount > 0 ? (pendingCount / guestlist.memberCount) * 100 : 0}%`,
                      backgroundColor: '#FF9800'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Guest List */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4" style={{ color: '#E07B39' }} />
              <h4 className="font-semibold" style={{ color: '#5B4A3A' }}>
                Guests ({guestlist.memberCount})
              </h4>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {guestlist.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ backgroundColor: '#F9F6F1' }}
                >
                  <UserAvatar name={member.name} imageUrl={member.imageUrl} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: '#5B4A3A' }}>
                      {member.name}
                    </p>
                    {member.email && (
                      <p className="text-xs truncate" style={{ color: '#8B7355' }}>
                        {member.email}
                      </p>
                    )}
                  </div>
                  {/* RSVP Status Badge */}
                  {member.rsvpStatus && (
                    <span
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: member.rsvpStatus === 'accepted' ? '#E8F5E9' : '#FFF3E0',
                        color: member.rsvpStatus === 'accepted' ? '#2E7D32' : '#E65100',
                      }}
                    >
                      {member.rsvpStatus === 'accepted' ? (
                        <><CheckCircle className="h-3 w-3" /> Accepted</>
                      ) : (
                        <><Clock className="h-3 w-3" /> Pending</>
                      )}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t" style={{ borderColor: '#E8DFD1' }}>
            <CustomButton
              variant="outline"
              onClick={() => {
                onEdit?.(guestlist);
                onClose();
              }}
              className="flex-1"
              style={{ borderColor: '#D8CFC0', color: '#5B4A3A' }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Guestlist
            </CustomButton>
            <CustomButton
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
              style={{ borderColor: '#FCA5A5', color: '#DC2626' }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Guestlist
            </CustomButton>
          </div>
        </div>
      </CustomFormDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Guestlist?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{guestlist.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
