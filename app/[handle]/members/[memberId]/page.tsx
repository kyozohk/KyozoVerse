'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, deleteDoc, updateDoc, collection, query, where, getDocs, increment } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { CommunityMember, Community } from '@/lib/types';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Mail, 
  Phone, 
  Edit, 
  Trash2, 
  ArrowLeft, 
  Tag, 
  Calendar,
  Shield,
  MessageCircle,
  User
} from 'lucide-react';
import { Banner } from '@/components/ui/banner';
import { MemberDialog } from '@/components/community/member-dialog';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getUserRoleInCommunity } from '@/lib/community-utils';
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

// Default banner images
const DEFAULT_BANNERS = [
  '/banner1.png',
  '/banner2.png',
  '/banner3.png',
];

// Get a random default banner based on member ID for consistency
const getDefaultBanner = (memberId: string): string => {
  const hash = memberId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return DEFAULT_BANNERS[hash % DEFAULT_BANNERS.length];
};

export default function MemberProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { handle, memberId } = params as { handle: string; memberId: string };
  
  const [member, setMember] = useState<CommunityMember | null>(null);
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (memberId && handle) {
      const fetchMemberAndCommunity = async () => {
        setLoading(true);
        try {
          // Fetch community by handle
          const communitiesRef = collection(db, 'communities');
          const communityQuery = query(communitiesRef, where('handle', '==', handle));
          const communitySnap = await getDocs(communityQuery);
          
          if (communitySnap.empty) {
            throw new Error("Community not found");
          }
          
          const communityDoc = communitySnap.docs[0];
          const communityData = { communityId: communityDoc.id, ...communityDoc.data() } as Community;
          setCommunity(communityData);
          
          // Fetch user role
          if (user) {
            const role = await getUserRoleInCommunity(user.uid, communityData.communityId);
            setUserRole(role);
          }
          
          // Fetch member by userId and communityId (like app1)
          const membersRef = collection(db, "communityMembers");
          const memberQuery = query(
            membersRef, 
            where("userId", "==", memberId), 
            where("communityId", "==", communityData.communityId)
          );
          const memberSnap = await getDocs(memberQuery);

          if (!memberSnap.empty) {
            const memberDoc = memberSnap.docs[0];
            const memberData = memberDoc.data();
            
            // Use userDetails from the member document (like app1)
            // This is the embedded user details stored when member was added
            setMember({ 
              id: memberDoc.id, 
              ...memberData,
            } as CommunityMember);
          } else {
            console.log('No such member in this community!');
          }
        } catch (error) {
          console.error("Error fetching member data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchMemberAndCommunity();
    }
  }, [memberId, handle, user]);

  const handleDeleteMember = async () => {
    if (!member || !community) return;
    
    setIsDeleting(true);
    try {
      // Delete the member document
      await deleteDoc(doc(db, 'communityMembers', member.id));
      
      // Decrement member count
      await updateDoc(doc(db, 'communities', community.communityId), {
        memberCount: increment(-1)
      });
      
      toast({
        title: 'Member Removed',
        description: `${member.userDetails?.displayName || 'Member'} has been removed from the community.`,
      });
      
      // Navigate back to members list
      router.push(`/${handle}/members`);
    } catch (error) {
      console.error('Error deleting member:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove member. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  const handleEditSubmit = async (data: {
    displayName: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
    coverUrl?: string;
  }) => {
    if (!member) return;
    
    try {
      // Update the userDetails in the communityMember document
      // Note: We only update communityMembers, not the users collection directly
      // because Firebase rules may not allow admins to update other users' documents
      const memberDocRef = doc(db, 'communityMembers', member.id);
      await updateDoc(memberDocRef, {
        'userDetails.displayName': data.displayName,
        'userDetails.email': data.email,
        'userDetails.phone': data.phone || '',
        'userDetails.avatarUrl': data.avatarUrl || '',
        'userDetails.coverUrl': data.coverUrl || '',
      });

      // Refresh member data from Firestore
      const memberSnap = await getDoc(memberDocRef);
      if (memberSnap.exists()) {
        setMember({ id: memberSnap.id, ...memberSnap.data() } as CommunityMember);
      }

      toast({
        title: 'Success',
        description: 'Member profile updated successfully',
      });

      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating member:', error);
      toast({
        title: 'Error',
        description: 'Failed to update member profile',
        variant: 'destructive',
      });
    }
  };

  const canManage = userRole === 'owner' || userRole === 'admin';

  const formatDate = (date: any): string => {
    if (!date) return 'Unknown';
    if (date?.seconds) {
      return new Date(date.seconds * 1000).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Unknown';
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--page-bg-color)' }}>
        <div className="p-8 flex-1 overflow-auto">
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--page-content-bg)', border: '2px solid var(--page-content-border)' }}>
            <Skeleton className="h-48 w-full" />
            <div className="p-8">
              <div className="flex items-start gap-6">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-8 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!member || !member.userDetails) {
    return (
      <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--page-bg-color)' }}>
        <div className="p-8">
          <div className="rounded-2xl p-8" style={{ backgroundColor: 'var(--page-content-bg)', border: '2px solid var(--page-content-border)' }}>
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <p className="text-center text-muted-foreground">Member not found.</p>
          </div>
        </div>
      </div>
    );
  }
  
  const { userDetails } = member;

  // Format role for display
  const getRoleLabel = (role?: string) => {
    switch (role?.toLowerCase()) {
      case 'owner': return 'Owner';
      case 'admin': return 'Admin';
      default: return 'Member';
    }
  };

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--page-bg-color)' }}>
      <div className="p-8 flex-1 overflow-auto">
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--page-content-bg)', border: '2px solid var(--page-content-border)' }}>
          {/* Member Banner */}
          <Banner
            backgroundImage={userDetails.coverUrl || getDefaultBanner(memberId)}
            iconImage={userDetails.avatarUrl}
            iconSize={100}
            title={userDetails.displayName || 'Unknown User'}
            location={community?.name ? `Member of ${community.name}` : undefined}
            locationExtra={
              <Badge 
                variant="outline" 
                className={`capitalize text-white border-white/50 bg-white/10 ${
                  member.role === 'owner' ? 'bg-amber-500/30' :
                  member.role === 'admin' ? 'bg-purple-500/30' :
                  ''
                }`}
              >
                <Shield className="h-3 w-3 mr-1" />
                {getRoleLabel(member.role)}
              </Badge>
            }
            subtitle={userDetails.email}
            leftCta={{
              label: 'Back to Members',
              icon: <ArrowLeft className="h-4 w-4" />,
              onClick: () => router.push(`/${handle}/members`),
            }}
            ctas={canManage ? [
              {
                label: 'Edit',
                icon: <Edit className="h-4 w-4" />,
                onClick: () => setIsEditDialogOpen(true),
              },
              {
                label: 'Delete',
                icon: <Trash2 className="h-4 w-4" />,
                onClick: () => setIsDeleteConfirmOpen(true),
              },
            ] : []}
            height="16rem"
          />
        </div>
        
        {/* Profile Details */}
        <div className="mt-6 rounded-2xl p-8" style={{ backgroundColor: 'var(--page-content-bg)', border: '2px solid var(--page-content-border)' }}>

            {/* Details grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userDetails.email && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-secondary">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{userDetails.email}</p>
                      </div>
                    </div>
                  )}
                  {userDetails.phone && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-secondary">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{userDetails.phone}</p>
                      </div>
                    </div>
                  )}
                  {!userDetails.email && !userDetails.phone && (
                    <p className="text-sm text-muted-foreground">No contact information available</p>
                  )}
                </CardContent>
              </Card>

              {/* Membership Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Membership Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-secondary">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Joined</p>
                      <p className="font-medium">{formatDate(member.joinedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-secondary">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Role</p>
                      <p className="font-medium capitalize">{member.role || 'Member'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-secondary">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="font-medium capitalize">{member.status || 'Active'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tags */}
            {member.tags && member.tags.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {member.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      
      {/* Edit Member Dialog */}
      <MemberDialog
        open={isEditDialogOpen}
        mode="edit"
        communityName={community?.name}
        initialMember={member}
        onClose={() => setIsEditDialogOpen(false)}
        onSubmit={handleEditSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Member
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Are you sure you want to permanently delete <strong>{userDetails.displayName}</strong> from {community?.name}?
              </p>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm">
                <p className="font-semibold text-destructive mb-2">⚠️ Warning: This will permanently delete:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Member profile and all personal data</li>
                  <li>All inbox messages and conversations</li>
                  <li>Activity history and engagement data</li>
                  <li>Tags and group memberships</li>
                  <li>Any uploaded files or media</li>
                </ul>
              </div>
              <p className="text-sm font-medium text-destructive">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteMember}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
