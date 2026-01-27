'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Community } from '@/lib/types';
import { Loader2, Send, Mail } from 'lucide-react';
import { PageLayout } from '@/components/v2/page-layout';
import { PageHeader } from '@/components/v2/page-header';
import { EnhancedListView } from '@/components/v2/enhanced-list-view';
import { MemberGridItem, MemberListItem, MemberCircleItem } from '@/components/v2/member-items';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getCommunityTags, type CommunityTag } from '@/lib/community-tags';

interface MemberData {
  id: string;
  name: string;
  email?: string;
  imageUrl: string;
  role?: string;
  userId: string;
  joinedDate?: any;
  tags?: string[];
}

function BroadcastContent() {
  const params = useParams();
  const handle = params.handle as string;
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<MemberData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBroadcastDialogOpen, setIsBroadcastDialogOpen] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const [availableTags, setAvailableTags] = useState<CommunityTag[]>([]);

  useEffect(() => {
    const fetchCommunityAndMembers = async () => {
      try {
        setIsLoading(true);

        const communityQuery = query(collection(db, 'communities'), where('handle', '==', handle));
        const communitySnapshot = await getDocs(communityQuery);
        
        if (communitySnapshot.empty) {
          setIsLoading(false);
          return;
        }

        const communityData = {
          communityId: communitySnapshot.docs[0].id,
          ...communitySnapshot.docs[0].data()
        } as Community;
        setCommunity(communityData);

        const tags = await getCommunityTags(communityData.communityId);
        setAvailableTags(tags);

        const membersQuery = query(
          collection(db, 'communityMembers'),
          where('communityId', '==', communityData.communityId)
        );
        const membersSnapshot = await getDocs(membersQuery);

        const membersData = membersSnapshot.docs.map((memberDoc) => {
          const memberData = memberDoc.data();
          const userDetails = memberData.userDetails || {};
          
          return {
            id: memberDoc.id,
            userId: memberData.userId,
            name: userDetails.displayName || userDetails.email || 'Unknown User',
            email: userDetails.email || '',
            imageUrl: userDetails.avatarUrl || userDetails.photoURL || '/placeholder-avatar.png',
            role: memberData.role || 'member',
            joinedDate: memberData.joinedAt,
            tags: memberData.tags || [],
          };
        });
        
        setMembers(membersData);
      } catch (error) {
        console.error('Error fetching community and members:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommunityAndMembers();
  }, [handle]);

  const handleOpenBroadcastDialog = () => {
    if (selectedMembers.length === 0) return;
    setIsBroadcastDialogOpen(true);
  };

  const handleSendBroadcast = async () => {
    if (!community || selectedMembers.length === 0 || !broadcastSubject.trim() || !broadcastMessage.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in subject and message',
        variant: 'destructive',
      });
      return;
    }

    const membersWithEmail = selectedMembers.filter(m => m.email && m.email.trim());
    if (membersWithEmail.length === 0) {
      toast({
        title: 'Error',
        description: 'No selected members have email addresses',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    let successCount = 0;
    let failCount = 0;

    for (const member of membersWithEmail) {
      try {
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: member.email,
            from: 'Kyozo <dev@contact.kyozo.com>',
            subject: broadcastSubject,
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif; margin: 0; padding: 20px; background-color: #f3f4f6;">
                  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                      <h1 style="color: #5B4A3A; margin: 0; font-size: 24px;">${community.name}</h1>
                    </div>
                    <div style="color: #374151; font-size: 16px; line-height: 1.6;">
                      <p>Hi ${member.name},</p>
                      <div style="white-space: pre-wrap;">${broadcastMessage}</div>
                    </div>
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                      <p style="color: #9ca3af; font-size: 12px; margin: 0;">Sent from ${community.name} via Kyozo</p>
                    </div>
                  </div>
                </body>
              </html>
            `,
          }),
        });

        if (response.ok) {
          successCount++;
        } else {
          failCount++;
          console.error(`Failed to send to ${member.email}`);
        }
      } catch (error) {
        failCount++;
        console.error(`Error sending to ${member.email}:`, error);
      }
    }

    setIsSending(false);
    setIsBroadcastDialogOpen(false);
    setBroadcastSubject('');
    setBroadcastMessage('');

    if (successCount > 0) {
      toast({
        title: 'Broadcast Sent',
        description: `Successfully sent to ${successCount} member${successCount > 1 ? 's' : ''}${failCount > 0 ? `. ${failCount} failed.` : ''}`,
      });
    } else {
      toast({
        title: 'Broadcast Failed',
        description: 'Failed to send emails. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-input bg-card p-6 animate-pulse">
          <div className="aspect-square bg-muted rounded-full mb-4 mx-auto w-20 h-20" />
          <div className="h-5 bg-muted rounded w-3/4 mb-2 mx-auto" />
          <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
        </div>
      ))}
    </div>
  );

  if (!community && !isLoading) {
    return (
      <PageLayout>
        <div className="p-8">Community not found</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title={community ? `${community.name} - Broadcast` : 'Broadcast'}
        description={`Select members to send a broadcast message`}
        actions={
          <Button 
            variant="selected" 
            onClick={handleOpenBroadcastDialog}
            disabled={selectedMembers.length === 0}
          >
            <Mail className="mr-2 h-4 w-4" />
            Message {selectedMembers.length} {selectedMembers.length === 1 ? 'Member' : 'Members'}
          </Button>
        }
      />
      <EnhancedListView
        items={members}
        availableTags={availableTags}
        renderGridItem={(item, isSelected) => (
          <MemberGridItem item={item} isSelected={isSelected} />
        )}
        renderListItem={(item, isSelected) => (
          <MemberListItem item={item} isSelected={isSelected} />
        )}
        renderCircleItem={(item, isSelected) => (
          <MemberCircleItem item={item} isSelected={isSelected} />
        )}
        searchKeys={['name', 'email']}
        selectable={true}
        onSelectionChange={(ids, items) => setSelectedMembers(items)}
        isLoading={isLoading}
        loadingComponent={<LoadingSkeleton />}
      />
      {/* Broadcast Email Dialog */}
      <Dialog open={isBroadcastDialogOpen} onOpenChange={setIsBroadcastDialogOpen}>
        <DialogContent className="sm:max-w-[600px]" style={{ backgroundColor: '#F5F0E8' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#5B4A3A' }}>Send Broadcast Email</DialogTitle>
            <DialogDescription>
              Send an email to {selectedMembers.filter(m => m.email).length} selected member{selectedMembers.filter(m => m.email).length !== 1 ? 's' : ''} with email addresses
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="subject" style={{ color: '#5B4A3A' }}>Subject</Label>
              <Input
                id="subject"
                placeholder="Enter email subject..."
                value={broadcastSubject}
                onChange={(e) => setBroadcastSubject(e.target.value)}
                style={{ backgroundColor: 'white', borderColor: '#E8DFD1' }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message" style={{ color: '#5B4A3A' }}>Message</Label>
              <Textarea
                id="message"
                placeholder="Enter your message..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                rows={8}
                style={{ backgroundColor: 'white', borderColor: '#E8DFD1' }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBroadcastDialogOpen(false)}
              disabled={isSending}
              style={{ borderColor: '#E8DFD1', color: '#5B4A3A' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendBroadcast}
              disabled={isSending || !broadcastSubject.trim() || !broadcastMessage.trim()}
              style={{ backgroundColor: '#5B4A3A', color: 'white' }}
            >
              {isSending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
              ) : (
                <><Send className="mr-2 h-4 w-4" /> Send Broadcast</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}

export default function BroadcastPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <BroadcastContent />
    </Suspense>
  );
}
