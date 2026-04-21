'use client';

import { useState } from 'react';
import { CustomFormDialog } from '@/components/ui/dialog';
import { CustomButton } from '@/components/ui/CustomButton';
import { Calendar, MapPin, Users, Edit, Trash2 } from 'lucide-react';
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

interface GuestlistMember {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  imageUrl?: string;
  tags?: string[];
  // KYPRO-21: expose the per-guest RSVP status that's already persisted in
  // Firestore (see create-guestlist-dialog.tsx) so the detail dialog can
  // display Yes / No / Maybe / Pending pills.
  rsvpStatus?: 'yes' | 'no' | 'maybe' | 'pending' | 'invited' | string;
}

// KYPRO-21: small helper to style the status pill consistently.
function rsvpPillStyle(status?: string): { bg: string; fg: string; label: string } {
  switch ((status || 'pending').toLowerCase()) {
    case 'yes':      return { bg: '#DCF2E3', fg: '#1E7A3A', label: 'Yes' };
    case 'no':       return { bg: '#FCE4E4', fg: '#B3261E', label: 'No' };
    case 'maybe':    return { bg: '#FFF4D6', fg: '#8A6D1F', label: 'Maybe' };
    case 'invited':  return { bg: '#E8DFD1', fg: '#5B4A3A', label: 'Invited' };
    default:         return { bg: '#EFEBE3', fg: '#8B7355', label: 'Pending' };
  }
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
        // KYPRO-19: the old fallback "Guestlist Details" looked like a link
        // to a non-existent detail page and gave the impression something was
        // broken. Fall back to an empty description instead — the dialog title
        // (the guestlist name) already provides the context.
        description={guestlist.eventName || ''}
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

          {/* Guest List */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4" style={{ color: '#E07B39' }} />
              <h4 className="font-semibold" style={{ color: '#5B4A3A' }}>
                Guests ({guestlist.memberCount})
              </h4>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {guestlist.members.map((member) => {
                // KYPRO-21: derive the pill styling from the persisted status.
                const pill = rsvpPillStyle(member.rsvpStatus);
                return (
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
                    {/* KYPRO-21: RSVP status pill — surfaces the already-persisted
                        rsvpStatus field so admins can see who responded. */}
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: pill.bg, color: pill.fg }}
                      title={`RSVP status: ${pill.label}`}
                    >
                      {pill.label}
                    </span>
                  </div>
                );
              })}
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
