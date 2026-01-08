
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, deleteDoc, updateDoc, collection, query, where, getDocs, increment } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { User, CommunityMember } from '@/lib/types';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage, Button, Card, CardContent, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger, Skeleton, Badge } from '@/components/ui';
import { Mail, Phone, Edit, Trash2, MessageCircle, Users, Heart, Eye, ArrowLeft, Tag } from 'lucide-react';
import { MemberDialog } from '@/components/community/member-dialog';
import BroadcastDialog from '@/components/broadcast/broadcast-dialog';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export default function MemberProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { handle, memberId } = params as { handle: string, memberId: string };
  
  const [member, setMember] = useState<CommunityMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isBroadcastDialogOpen, setIsBroadcastDialogOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  useEffect(() => {
    if (memberId && handle) {
      const fetchMember = async () => {
        setLoading(true);
        try {
          const communitiesRef = collection(db, 'communities');
          const communityQuery = query(communitiesRef, where('handle', '==', handle));
          const communitySnap = await getDocs(communityQuery);
          
          if (communitySnap.empty) {
            throw new Error("Community not found");
          }
          const communityId = communitySnap.docs[0].id;
          
          const membersRef = collection(db, "communityMembers");
          const q = query(membersRef, where("userId", "==", memberId), where("communityId", "==", communityId));
          const memberSnap = await getDocs(q);

          if (!memberSnap.empty) {
            const memberDoc = memberSnap.docs[0];
            setMember({ id: memberDoc.id, ...memberDoc.data() } as CommunityMember);
          } else {
            console.log('No such member in this community!');
          }
        } catch (error) {
          console.error("Error fetching member data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchMember();
    }
  }, [memberId, handle]);

  if (loading) {
    return (
      <div className="space-y-4 p-8">
        <Skeleton className="h-48 w-full" />
        <div className="flex items-end -mt-16 ml-8">
          <Skeleton className="h-24 w-24 rounded-full border-4 border-background" />
        </div>
        <Skeleton className="h-8 w-1/4 mt-4 ml-8" />
        <Skeleton className="h-4 w-1/2 ml-8" />
        <div className="p-8">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!member || !member.userDetails) {
    return <div className="p-8 text-center">Member not found.</div>;
  }
  
  const { userDetails } = member;

  return (
    <div className="flex-1">
      {/* Banner with transparent overlay - matching community header style */}
      <div className="relative w-full h-64">
        {/* Background Image */}
        {userDetails.coverUrl ? (
          <Image 
            src={userDetails.coverUrl} 
            alt={`${userDetails.displayName}'s cover image`} 
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600" />
        )}
        
        {/* 50% transparent overlay for better text visibility */}
        <div className="absolute inset-0 bg-black/50"></div>
        
        {/* Content - positioned absolutely inside banner */}
        <div className="absolute inset-0 z-10 p-6 md:p-8 flex flex-col justify-between">
          {/* Back button */}
          <div className="mb-4">
            <Button variant="ghost" onClick={() => router.back()} className="text-white/80 hover:text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Members
            </Button>
          </div>

          <div className="flex justify-between items-end h-full">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <Avatar className="h-24 w-24 border-4 border-white/10">
                  <AvatarImage src={userDetails.avatarUrl} />
                  <AvatarFallback className="text-2xl">{userDetails.displayName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
              </div>

              <div className="flex-grow">
                <h1 className="text-3xl md:text-4xl font-bold text-white">{userDetails.displayName}</h1>
                <p className="text-lg text-white/70 mt-1">{member.role || 'Member'}</p>
                
                {member.tags && member.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {member.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="bg-white/20 text-white backdrop-blur-sm">
                        <Tag className="h-3 w-3 mr-1.5" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="flex flex-wrap gap-4 mt-4 text-sm">
                  {userDetails.email && (
                    <div className="flex items-center gap-2 text-white/80">
                      <Mail className="h-4 w-4" /> 
                      <span>{userDetails.email}</span>
                    </div>
                  )}
                  {(userDetails.phone) && (
                    <div className="flex items-center gap-2 text-white/80">
                      <Phone className="h-4 w-4" /> 
                      <span>{userDetails.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons - matching community header style */}
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white/80 hover:text-white hover:bg-white/10"
                onClick={() => setIsEditDialogOpen(true)}
                title="Edit member"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white/80 hover:text-white hover:bg-white/10"
                onClick={async () => {
                  // Fetch templates before opening broadcast dialog
                  setLoadingTemplates(true);
                  try {
                    const response = await fetch('/api/whatsapp/templates');
                    const data = await response.json();
                    if (data.success && data.templates) {
                      setTemplates(data.templates);
                    }
                  } catch (error) {
                    console.error('Error fetching templates:', error);
                  } finally {
                    setLoadingTemplates(false);
                    setIsBroadcastDialogOpen(true);
                  }
                }}
                title="Send WhatsApp message"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white/80 hover:text-red-400 hover:bg-white/10"
                onClick={() => setIsDeleteConfirmOpen(true)}
                title="Delete member"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* Edit Member Dialog */}
        <MemberDialog
          open={isEditDialogOpen}
          mode="edit"
          communityName={handle}
          initialMember={member}
          onClose={() => setIsEditDialogOpen(false)}
          onSubmit={async (data) => {
            try {
              // Update the user document in Firestore
              const userDocRef = doc(db, 'users', memberId);
              await updateDoc(userDocRef, {
                displayName: data.displayName,
                email: data.email,
                phone: data.phone || '',
                avatarUrl: data.avatarUrl || '',
                coverUrl: data.coverUrl || '',
              });

              // Refresh member data after edit
              const memberSnap = await getDoc(doc(db, "communityMembers", member.id));
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
          }}
        />

        {/* Broadcast Dialog for single member */}
        {member && (
          <BroadcastDialog
            isOpen={isBroadcastDialogOpen}
            onClose={() => setIsBroadcastDialogOpen(false)}
            members={[member]}
            templates={templates}
            loadingTemplates={loadingTemplates}
          />
        )}

        {/* Delete Confirmation Dialog */}
        {isDeleteConfirmOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle>Delete Member</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">Are you sure you want to delete this member? This action cannot be undone.</p>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={async () => {
                      try {
                        // First get community by handle
                        const communitiesRef = collection(db, 'communities');
                        const communityQuery = query(communitiesRef, where('handle', '==', handle));
                        const communitySnap = await getDocs(communityQuery);
                        
                        if (communitySnap.empty) {
                          throw new Error('Community not found');
                        }
                        
                        const communityId = communitySnap.docs[0].id;
                        
                        // Find and delete the member document from communityMembers
                        const membersRef = collection(db, 'communityMembers');
                        const memberQuery = query(
                          membersRef,
                          where('userId', '==', memberId),
                          where('communityId', '==', communityId)
                        );
                        const memberSnapshot = await getDocs(memberQuery);
                        
                        if (!memberSnapshot.empty) {
                          // Delete the community member document
                          await deleteDoc(memberSnapshot.docs[0].ref);
                          console.log('Member removed from community');
                          
                          // Decrement member count
                          const communityRef = doc(db, 'communities', communityId);
                          await updateDoc(communityRef, {
                            memberCount: increment(-1),
                          });
                          
                          toast({
                            title: "Member Removed",
                            description: "The member has been removed from the community.",
                          });
                        }
                        
                        setIsDeleteConfirmOpen(false);
                        router.push(`/${handle}/members`);
                      } catch (error) {
                        console.error('Error deleting member:', error);
                        toast({
                          title: "Error",
                          description: "Failed to remove member. Please try again.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="activity">
          <TabsList>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="communities">Communities</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground py-12">
                <Heart className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Activity feed coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="communities">
             <Card>
              <CardHeader>
                <CardTitle>Member Of</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground py-12">
                <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Community list coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="messages">
             <Card>
              <CardHeader>
                <CardTitle>Messages</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground py-12">
                <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Messaging history coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
