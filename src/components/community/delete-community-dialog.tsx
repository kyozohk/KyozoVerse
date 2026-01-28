'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { CustomButton } from '@/components/ui/CustomButton';
import { CustomFormDialog } from '@/components/ui/dialog';
import { AlertTriangle, Users, FileText, MessageSquare, Mail } from 'lucide-react';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { type Community, type User } from '@/lib/types';

interface DeleteCommunityDialogProps {
  community: Community;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeleteCommunityDialog: React.FC<DeleteCommunityDialogProps> = ({
  community,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [members, setMembers] = useState<User[]>([]);
  const [postsCount, setPostsCount] = useState(0);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadCommunityData();
      setConfirmText('');
    }
  }, [isOpen, community.communityId]);

  const loadCommunityData = async () => {
    setLoadingData(true);
    try {
      // Get all community members
      const membersRef = collection(db, 'communityMembers');
      const membersQuery = query(membersRef, where('communityId', '==', community.communityId));
      const membersSnapshot = await getDocs(membersQuery);
      
      const membersList: User[] = [];
      for (const memberDoc of membersSnapshot.docs) {
        const memberData = memberDoc.data();
        if (memberData.userDetails) {
          membersList.push({
            userId: memberData.userId,
            displayName: memberData.userDetails.displayName || 'Unknown',
            email: memberData.userDetails.email || '',
            phone: memberData.userDetails.phone || '',
          } as User);
        }
      }
      setMembers(membersList);

      // Get posts count
      const postsRef = collection(db, 'blogs');
      const postsQuery = query(postsRef, where('communityId', '==', community.communityId));
      const postsSnapshot = await getDocs(postsQuery);
      setPostsCount(postsSnapshot.size);

    } catch (error) {
      console.error('Error loading community data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleDelete = async () => {
    if (confirmText !== community.handle) {
      return;
    }

    setIsDeleting(true);
    try {
      // Delete community subdomain from GoDaddy and Resend
      try {
        const domainResponse = await fetch('/api/delete-community-domain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ handle: community.handle }),
        });
        const domainResult = await domainResponse.json();
        console.log('Community domain cleanup result:', domainResult);
        
        if (!domainResult.resend?.success) {
          console.warn('Resend domain deletion failed:', domainResult.resend?.error);
        }
        if (!domainResult.godaddy?.success) {
          console.warn('GoDaddy DNS deletion failed:', domainResult.godaddy?.error);
        }
      } catch (domainError) {
        console.warn('Failed to cleanup community domain:', domainError);
        // Continue with deletion even if domain cleanup fails
      }

      // Delete all posts
      const postsRef = collection(db, 'blogs');
      const postsQuery = query(postsRef, where('communityId', '==', community.communityId));
      const postsSnapshot = await getDocs(postsQuery);
      
      const deletePostsPromises = postsSnapshot.docs.map(postDoc => deleteDoc(postDoc.ref));
      await Promise.all(deletePostsPromises);

      // Delete all community members
      const membersRef = collection(db, 'communityMembers');
      const membersQuery = query(membersRef, where('communityId', '==', community.communityId));
      const membersSnapshot = await getDocs(membersQuery);
      
      const deleteMembersPromises = membersSnapshot.docs.map(memberDoc => deleteDoc(memberDoc.ref));
      await Promise.all(deleteMembersPromises);

      // Delete the community document
      await deleteDoc(doc(db, 'communities', community.communityId));

      onSuccess();
    } catch (error) {
      console.error('Error deleting community:', error);
      alert('Failed to delete community. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <CustomFormDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Delete Community"
      description="This action cannot be undone"
      size="xl"
    >
      <div className="space-y-6 pt-4">
        {loadingData ? (
          <div className="py-8 text-center">
            <p style={{ color: '#6B5D52' }}>Loading community data...</p>
          </div>
        ) : (
          <>
            {/* Warning Banner */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">
                    You are about to delete "{community.name}"
                  </h3>
                  <p className="text-sm text-red-800">
                    This will permanently remove all data associated with this community.
                  </p>
                </div>
              </div>
            </div>

            {/* What will be deleted */}
            <div className="space-y-3">
              <h4 className="font-medium" style={{ color: '#5B4A3A' }}>The following will be permanently deleted:</h4>
              
              <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--page-content-bg)', border: '1px solid var(--page-content-border)' }}>
                <Users className="h-5 w-5 mt-0.5" style={{ color: '#6B5D52' }} />
                <div>
                  <p className="font-medium" style={{ color: '#5B4A3A' }}>{members.length} Members</p>
                  <p className="text-sm" style={{ color: '#6B5D52' }}>All member associations will be removed</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--page-content-bg)', border: '1px solid var(--page-content-border)' }}>
                <FileText className="h-5 w-5 mt-0.5" style={{ color: '#6B5D52' }} />
                <div>
                  <p className="font-medium" style={{ color: '#5B4A3A' }}>{postsCount} Posts & Content</p>
                  <p className="text-sm" style={{ color: '#6B5D52' }}>All posts and media will be deleted</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--page-content-bg)', border: '1px solid var(--page-content-border)' }}>
                <MessageSquare className="h-5 w-5 mt-0.5" style={{ color: '#6B5D52' }} />
                <div>
                  <p className="font-medium" style={{ color: '#5B4A3A' }}>Messages & Interactions</p>
                  <p className="text-sm" style={{ color: '#6B5D52' }}>All community messages will be lost</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--page-content-bg)', border: '1px solid var(--page-content-border)' }}>
                <Mail className="h-5 w-5 mt-0.5" style={{ color: '#6B5D52' }} />
                <div>
                  <p className="font-medium" style={{ color: '#5B4A3A' }}>Email Domain</p>
                  <p className="text-sm" style={{ color: '#6B5D52' }}>message@{community.handle}.kyozo.com will be removed</p>
                </div>
              </div>
            </div>

            {/* Confirmation Input */}
            <div className="pt-2">
              <label className="block text-sm font-medium mb-2" style={{ color: '#5B4A3A' }}>
                Type <span className="font-bold text-red-600">{community.handle}</span> to confirm deletion:
              </label>
              <Input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={`Type "${community.handle}" here`}
                className="w-full"
                autoFocus
              />
              {confirmText && confirmText !== community.handle && (
                <p className="text-sm text-red-600 mt-2">
                  Handle doesn't match. Please type exactly: {community.handle}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4">
              <CustomButton 
                variant="filled" 
                onClick={onClose} 
                disabled={isDeleting}
                className="px-6"
              >
                Cancel
              </CustomButton>
              <CustomButton
                onClick={handleDelete}
                disabled={confirmText !== community.handle || isDeleting}
                className="px-6"
                style={{ 
                  backgroundColor: confirmText === community.handle && !isDeleting ? '#DC2626' : '#FCA5A5',
                  color: 'white',
                  cursor: confirmText !== community.handle || isDeleting ? 'not-allowed' : 'pointer'
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Community Forever'}
              </CustomButton>
            </div>
          </>
        )}
      </div>
    </CustomFormDialog>
  );
};
