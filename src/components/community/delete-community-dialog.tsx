'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Users, FileText, MessageSquare, X } from 'lucide-react';
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
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [members, setMembers] = useState<User[]>([]);
  const [postsCount, setPostsCount] = useState(0);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadCommunityData();
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
    if (confirmText !== community.name) {
      return;
    }

    setIsDeleting(true);
    try {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="max-w-2xl w-full my-8">
        <CardHeader className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-xl">Delete Community</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Step {step} of 3
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loadingData ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Loading community data...</p>
            </div>
          ) : (
            <>
              {/* Step 1: Warning */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-semibold text-red-900 mb-2">
                      ⚠️ This action cannot be undone
                    </h3>
                    <p className="text-sm text-red-800">
                      Deleting <strong>{community.name}</strong> will permanently remove:
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <FileText className="h-5 w-5 text-gray-600 mt-0.5" />
                      <div>
                        <p className="font-medium">All Posts & Content</p>
                        <p className="text-sm text-muted-foreground">
                          {postsCount} post{postsCount !== 1 ? 's' : ''} will be permanently deleted
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <Users className="h-5 w-5 text-gray-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Community Members</p>
                        <p className="text-sm text-muted-foreground">
                          {members.length} member{members.length !== 1 ? 's' : ''} will be removed from this community
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-gray-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Messages & Interactions</p>
                        <p className="text-sm text-muted-foreground">
                          All community messages and interactions will be lost
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <Button variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => setStep(2)}
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Members List */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Community Members</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      The following {members.length} member{members.length !== 1 ? 's' : ''} will be removed from this community:
                    </p>
                  </div>

                  <div className="max-h-64 overflow-y-auto border rounded-lg">
                    {members.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        No members in this community
                      </div>
                    ) : (
                      <div className="divide-y">
                        {members.map((member, index) => (
                          <div key={index} className="p-3 flex items-center gap-3 hover:bg-gray-50">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
                              {member.displayName?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{member.displayName}</p>
                              <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Members will only be removed from this community. 
                      Their accounts and memberships in other communities will remain intact.
                    </p>
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => setStep(3)}
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Final Confirmation */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-semibold text-red-900 mb-2">
                      Final Confirmation Required
                    </h3>
                    <p className="text-sm text-red-800">
                      This is your last chance to cancel. Once deleted, all data will be permanently lost.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Type <span className="font-bold text-red-600">{community.name}</span> to confirm deletion:
                    </label>
                    <Input
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder={`Type "${community.name}" here`}
                      className="w-full"
                      autoFocus
                    />
                    {confirmText && confirmText !== community.name && (
                      <p className="text-sm text-red-600 mt-2">
                        Community name doesn't match
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <Button variant="outline" onClick={() => setStep(2)} disabled={isDeleting}>
                      Back
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleDelete}
                      disabled={confirmText !== community.name || isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete Community Forever'}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
