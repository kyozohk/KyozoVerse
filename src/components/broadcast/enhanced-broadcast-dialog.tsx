'use client';

import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EnhancedListView } from '@/components/v2/enhanced-list-view';
import { MemberGridItem, MemberListItem, MemberCircleItem } from '@/components/v2/member-items';
import { useToast } from '@/hooks/use-toast';

interface MemberData {
  id: string;
  userId: string;
  name: string;
  email?: string;
  imageUrl: string;
  role?: string;
  joinedDate?: any;
  tags?: string[];
}

interface EnhancedBroadcastDialogProps {
  isOpen: boolean;
  onClose: () => void;
  members: MemberData[];
  communityName?: string;
  fromEmail?: string;
}

type BroadcastMode = 'email' | 'whatsapp';

export function EnhancedBroadcastDialog({
  isOpen,
  onClose,
  members,
  communityName,
  fromEmail = 'dev@kyozo.com'
}: EnhancedBroadcastDialogProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<BroadcastMode>('email');
  const [selectedMembers, setSelectedMembers] = useState<MemberData[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [currentStep, setCurrentStep] = useState<'recipients' | 'compose' | 'confirm'>('recipients');

  // Initialize selected members when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Start with all passed-in members selected
      setSelectedMembers(members);
      setCurrentStep('recipients');
      setSubject('');
      setMessage('');
    }
  }, [isOpen, members]);

  const handleRecipientsContinue = () => {
    if (selectedMembers.length === 0) {
      toast({
        title: 'No Recipients',
        description: 'Please select at least one member to continue.',
        variant: 'destructive',
      });
      return;
    }
    setCurrentStep('compose');
  };

  const handleComposeContinue = () => {
    if (mode === 'email') {
      if (!subject.trim() || !message.trim()) {
        toast({
          title: 'Missing Information',
          description: 'Please fill in both subject and message.',
          variant: 'destructive',
        });
        return;
      }
    } else {
      if (!message.trim()) {
        toast({
          title: 'Missing Message',
          description: 'Please enter a message.',
          variant: 'destructive',
        });
        return;
      }
    }
    setCurrentStep('confirm');
  };

  const handleSendBroadcast = async () => {
    setIsSending(true);
    
    try {
      if (mode === 'email') {
        await sendEmailBroadcast();
      } else {
        await sendWhatsAppBroadcast();
      }
      
      toast({
        title: 'Broadcast Sent',
        description: `Successfully sent to ${selectedMembers.length} member${selectedMembers.length === 1 ? '' : 's'}.`,
      });
      
      onClose();
    } catch (error) {
      console.error('Broadcast failed:', error);
      toast({
        title: 'Broadcast Failed',
        description: 'Failed to send broadcast. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const sendEmailBroadcast = async () => {
    const membersWithEmail = selectedMembers.filter(m => m.email && m.email.trim());
    
    if (membersWithEmail.length === 0) {
      throw new Error('No selected members have email addresses');
    }

    // Send emails to each member
    for (const member of membersWithEmail) {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: member.email,
          from: `Kyozo <${fromEmail}>`,
          subject: subject,
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
                    <h1 style="color: #5B4A3A; margin: 0; font-size: 24px;">${communityName || 'Community'}</h1>
                  </div>
                  <div style="color: #374151; font-size: 16px; line-height: 1.6;">
                    <p>Hi ${member.name},</p>
                    <div style="white-space: pre-wrap;">${message}</div>
                  </div>
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">Sent from ${communityName || 'Community'} via Kyozo</p>
                  </div>
                </div>
              </body>
            </html>
          `,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send to ${member.email}`);
      }
    }
  };

  const sendWhatsAppBroadcast = async () => {
    // TODO: Implement WhatsApp API integration
    console.log('WhatsApp broadcast to be implemented');
    toast({
      title: 'Coming Soon',
      description: 'WhatsApp broadcasting will be available soon.',
    });
  };

  const renderRecipientsStep = () => (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2" style={{ color: '#5B4A3A' }}>
          Fine-tune Recipients
        </h3>
        <p className="text-sm text-muted-foreground">
          You have {members.length} member{members.length === 1 ? '' : 's'} selected. You can further refine your selection by deselecting members or using tags to filter.
        </p>
      </div>
      
      <div className="max-h-96 overflow-y-auto border rounded-lg" style={{ backgroundColor: 'white', borderColor: '#E8DFD1' }}>
        <EnhancedListView
          items={members} // Show all originally selected members
          initialSelectedIds={members.map(m => m.id)} // Start with all members selected
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
          tagKey="tags"
          showTags={true}
        />
      </div>
      
      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">
          <span>{selectedMembers.length} member{selectedMembers.length === 1 ? '' : 's'} selected</span>
          {selectedMembers.length < members.length && (
            <span className="ml-2">
              ({members.length - selectedMembers.length} deselected)
            </span>
          )}
        </div>
        <Button
          onClick={handleRecipientsContinue}
          disabled={selectedMembers.length === 0}
          style={{ backgroundColor: '#5B4A3A', color: 'white' }}
        >
          Continue ({selectedMembers.length})
        </Button>
      </div>
    </div>
  );

  const renderComposeStep = () => (
    <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2" style={{ color: '#5B4A3A' }}>
          Compose Message
        </h3>
        <div className="flex gap-2">
          <Button
            variant={mode === 'email' ? 'default' : 'outline'}
            onClick={() => setMode('email')}
            className={mode === 'email' ? 'bg-primary' : ''}
            style={{ 
              backgroundColor: mode === 'email' ? '#5B4A3A' : 'transparent',
              borderColor: '#E8DFD1',
              color: mode === 'email' ? 'white' : '#5B4A3A'
            }}
          >
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
          <Button
            variant={mode === 'whatsapp' ? 'default' : 'outline'}
            onClick={() => setMode('whatsapp')}
            disabled
            style={{ 
              backgroundColor: mode === 'whatsapp' ? '#5B4A3A' : 'transparent',
              borderColor: '#E8DFD1',
              color: mode === 'whatsapp' ? 'white' : '#5B4A3A'
            }}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            WhatsApp (Coming Soon)
          </Button>
        </div>
      </div>

      {mode === 'email' && (
        <div className="grid gap-2">
          <Label htmlFor="subject" style={{ color: '#5B4A3A' }}>Subject</Label>
          <Input
            id="subject"
            placeholder="Enter email subject..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={{ backgroundColor: 'white', borderColor: '#E8DFD1' }}
          />
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="message" style={{ color: '#5B4A3A' }}>
          Message {mode === 'whatsapp' && '(WhatsApp)'}
        </Label>
        <Textarea
          id="message"
          placeholder="Enter your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={8}
          style={{ backgroundColor: 'white', borderColor: '#E8DFD1' }}
        />
      </div>

      <div className="flex items-center justify-between pt-4">
        <Button
          variant="outline"
          onClick={() => setCurrentStep('recipients')}
          style={{ borderColor: '#E8DFD1', color: '#5B4A3A' }}
        >
          Back
        </Button>
        <Button
          onClick={handleComposeContinue}
          style={{ backgroundColor: '#5B4A3A', color: 'white' }}
        >
          Continue
        </Button>
      </div>
    </div>
  );

  const renderConfirmStep = () => (
    <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2" style={{ color: '#5B4A3A' }}>
          Confirm & Send
        </h3>
        <p className="text-sm text-muted-foreground">
          Review your message before sending to {selectedMembers.length} member{selectedMembers.length === 1 ? '' : 's'}.
        </p>
      </div>

      <div className="border rounded-lg p-4 space-y-3" style={{ backgroundColor: 'white', borderColor: '#E8DFD1' }}>
        <div>
          <span className="text-sm font-medium" style={{ color: '#5B4A3A' }}>Mode:</span>
          <span className="ml-2 text-sm">{mode === 'email' ? 'Email' : 'WhatsApp'}</span>
        </div>
        {mode === 'email' && (
          <div>
            <span className="text-sm font-medium" style={{ color: '#5B4A3A' }}>Subject:</span>
            <span className="ml-2 text-sm">{subject}</span>
          </div>
        )}
        <div>
          <span className="text-sm font-medium" style={{ color: '#5B4A3A' }}>Recipients:</span>
          <span className="ml-2 text-sm">{selectedMembers.length} member{selectedMembers.length === 1 ? '' : 's'}</span>
        </div>
        <div>
          <span className="text-sm font-medium" style={{ color: '#5B4A3A' }}>Message:</span>
          <div className="mt-2 p-3 rounded text-sm" style={{ backgroundColor: '#F9F7F4' }}>
            {message}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        <Button
          variant="outline"
          onClick={() => setCurrentStep('compose')}
          style={{ borderColor: '#E8DFD1', color: '#5B4A3A' }}
        >
          Back
        </Button>
        <Button
          onClick={handleSendBroadcast}
          disabled={isSending}
          style={{ backgroundColor: '#5B4A3A', color: 'white' }}
        >
          {isSending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
          ) : (
            <><Send className="mr-2 h-4 w-4" /> Send Broadcast</>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#F5F0E8' }}>
        <DialogHeader>
          <DialogTitle style={{ color: '#5B4A3A' }}>
            {currentStep === 'recipients' && 'Select Recipients'}
            {currentStep === 'compose' && 'Compose Message'}
            {currentStep === 'confirm' && 'Confirm & Send'}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'recipients' && 'Choose the members to send your broadcast to.'}
            {currentStep === 'compose' && 'Create your message to send to selected members.'}
            {currentStep === 'confirm' && 'Review your message before sending.'}
          </DialogDescription>
        </DialogHeader>

        {currentStep === 'recipients' && renderRecipientsStep()}
        {currentStep === 'compose' && renderComposeStep()}
        {currentStep === 'confirm' && renderConfirmStep()}
      </DialogContent>
    </Dialog>
  );
}
