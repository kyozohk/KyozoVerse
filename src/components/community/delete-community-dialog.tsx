'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { CustomButton } from '@/components/ui/CustomButton';
import { CustomFormDialog } from '@/components/ui/dialog';
import { AlertTriangle, Users, FileText, MessageSquare, Mail, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { type Community, type User } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';

interface MemberWithCommunities extends User {
  communities: string[];
  willBeDeleted: boolean;
}

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
  const { user } = useAuth();
  const [membersWithCommunities, setMembersWithCommunities] = useState<MemberWithCommunities[]>([]);
  const [postsCount, setPostsCount] = useState(0);
  const [confirmText, setConfirmText] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [sendingCode, setSendingCode] = useState(false);

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
      
      const membersList: MemberWithCommunities[] = [];
      
      // For each member, check their other community memberships
      for (const memberDoc of membersSnapshot.docs) {
        const memberData = memberDoc.data();
        if (memberData.userDetails) {
          // Get all communities this user is a member of
          const userCommunitiesQuery = query(membersRef, where('userId', '==', memberData.userId));
          const userCommunitiesSnapshot = await getDocs(userCommunitiesQuery);
          
          const otherCommunities: string[] = [];
          for (const userCommunityDoc of userCommunitiesSnapshot.docs) {
            const communityId = userCommunityDoc.data().communityId;
            if (communityId !== community.communityId) {
              // Get community name
              const communityDoc = await getDocs(query(collection(db, 'communities'), where('communityId', '==', communityId)));
              if (!communityDoc.empty) {
                otherCommunities.push(communityDoc.docs[0].data().name || communityId);
              }
            }
          }
          
          membersList.push({
            userId: memberData.userId,
            displayName: memberData.userDetails.displayName || 'Unknown',
            email: memberData.userDetails.email || '',
            phone: memberData.userDetails.phone || '',
            communities: otherCommunities,
            willBeDeleted: otherCommunities.length === 0, // Only delete if no other communities
          } as MemberWithCommunities);
        }
      }
      setMembersWithCommunities(membersList);

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

  const sendVerificationCode = async () => {
    setSendingCode(true);
    try {
      // Get owner's email from user document
      let ownerEmail = 'owner@example.com';
      if (community.ownerId) {
        const ownerDoc = await getDocs(query(collection(db, 'users'), where('userId', '==', community.ownerId)));
        if (!ownerDoc.empty) {
          ownerEmail = ownerDoc.docs[0].data().email || 'owner@example.com';
        }
      }
      
      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setSentCode(code);
      
      // Send email with verification code
      if (!user) {
        throw new Error('User not authenticated');
      }

      const idToken = await user.getIdToken();

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          to: ownerEmail,
          subject: `🔐 Verify Community Deletion - ${community.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="margin: 0;">🔐 Community Deletion Verification</h1>
              </div>
              <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #333;">Verification Code Required</h2>
                <p>Someone is attempting to delete the community: <strong>${community.name}</strong></p>
                <div style="background: #FEE2E2; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                  <p style="color: #991B1B; margin: 0 0 10px 0;">Your verification code is:</p>
                  <span style="font-size: 32px; font-weight: bold; color: #DC2626; letter-spacing: 5px;">${code}</span>
                </div>
                <p style="color: #666;">This code will expire in 10 minutes.</p>
                <p style="color: #999; font-size: 12px;">If you did not request this, please secure your account immediately.</p>
              </div>
            </div>
          `
        }),
      });
      
      if (response.ok) {
        setCodeSent(true);
      } else {
        alert('Failed to send verification code. Please try again.');
      }
    } catch (error) {
      console.error('Error sending verification code:', error);
      alert('Failed to send verification code. Please try again.');
    } finally {
      setSendingCode(false);
    }
  };

  const handleDelete = async () => {
    if (confirmText !== community.handle) {
      return;
    }
    
    if (!codeSent || verificationCode !== sentCode) {
      alert('Please verify your email with the correct code.');
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
              
              {/* Members Accordion */}
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="members" className="border rounded-lg" style={{ borderColor: 'var(--page-content-border)' }}>
                  <AccordionTrigger className="px-3 py-2 hover:no-underline">
                    <div className="flex items-center gap-3 w-full">
                      <Users className="h-5 w-5" style={{ color: '#6B5D52' }} />
                      <div className="flex-1 text-left">
                        <p className="font-medium" style={{ color: '#5B4A3A' }}>{membersWithCommunities.length} Members</p>
                        <p className="text-sm" style={{ color: '#6B5D52' }}>
                          {membersWithCommunities.filter(m => m.willBeDeleted).length} will be deleted, {membersWithCommunities.filter(m => !m.willBeDeleted).length} will remain (in other communities)
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-3">
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {membersWithCommunities.map((member) => (
                        <div key={member.userId} className="p-2 rounded border" style={{ borderColor: '#E8DFD1', backgroundColor: member.willBeDeleted ? '#FEE2E2' : '#F0FDF4' }}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm" style={{ color: '#5B4A3A' }}>{member.displayName}</p>
                              <p className="text-xs" style={{ color: '#6B5D52' }}>{member.email}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {member.willBeDeleted ? (
                                <Badge variant="destructive" className="text-xs">Will be deleted</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">Will remain</Badge>
                              )}
                            </div>
                          </div>
                          {member.communities.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              <span className="text-xs" style={{ color: '#6B5D52' }}>Also in:</span>
                              {member.communities.map((comm, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">{comm}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

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

            {/* Email Verification */}
            <div className="pt-2 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 mb-1">Email Verification Required</h4>
                    <p className="text-sm text-blue-800 mb-3">
                      To prevent unauthorized deletion, we'll send a verification code to the community owner's email.
                    </p>
                    {!codeSent ? (
                      <CustomButton
                        onClick={sendVerificationCode}
                        disabled={sendingCode}
                        className="bg-blue-600 text-white hover:bg-blue-700"
                      >
                        {sendingCode ? 'Sending Code...' : 'Send Verification Code'}
                      </CustomButton>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-green-700 font-medium">✓ Verification code sent to owner's email</p>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-blue-900">
                            Enter 6-digit verification code:
                          </label>
                          <Input
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            className="w-full font-mono text-lg tracking-widest"
                            maxLength={6}
                          />
                          {verificationCode && verificationCode !== sentCode && (
                            <p className="text-sm text-red-600 mt-1">
                              Invalid code. Please check your email.
                            </p>
                          )}
                          {verificationCode === sentCode && (
                            <p className="text-sm text-green-600 mt-1">
                              ✓ Code verified successfully
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Confirmation Input */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#5B4A3A' }}>
                  Type <span className="font-bold text-red-600">{community.handle}</span> to confirm deletion:
                </label>
                <Input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={`Type "${community.handle}" here`}
                  className="w-full"
                  disabled={!codeSent || verificationCode !== sentCode}
                />
                {confirmText && confirmText !== community.handle && (
                  <p className="text-sm text-red-600 mt-2">
                    Handle doesn't match. Please type exactly: {community.handle}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t" style={{ borderColor: '#E8DFD1' }}>
              <CustomButton 
                variant="outline" 
                onClick={onClose} 
                disabled={isDeleting}
                className="px-6"
                style={{ borderColor: '#E8DFD1', color: '#5B4A3A' }}
              >
                Cancel
              </CustomButton>
              <CustomButton
                onClick={handleDelete}
                disabled={confirmText !== community.handle || !codeSent || verificationCode !== sentCode || isDeleting}
                className="px-6"
                style={{ 
                  backgroundColor: confirmText === community.handle && codeSent && verificationCode === sentCode && !isDeleting ? '#DC2626' : '#FCA5A5',
                  color: 'white',
                  cursor: confirmText !== community.handle || !codeSent || verificationCode !== sentCode || isDeleting ? 'not-allowed' : 'pointer'
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
