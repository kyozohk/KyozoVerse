'use client';

import React, { useState, useEffect } from 'react';
import { CustomFormDialog, CustomButton, Checkbox } from '@/components/ui';
import { AIInput } from '@/components/ui/ai-input';
import { AITextarea } from '@/components/ui/ai-textarea';
import { THEME_COLORS } from '@/lib/theme-colors';
import { CommunityMember } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailSendDialogProps {
  isOpen: boolean;
  onClose: () => void;
  members: CommunityMember[];
  communityName?: string;
}

export function EmailSendDialog({
  isOpen,
  onClose,
  members,
  communityName
}: EmailSendDialogProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<CommunityMember[]>([]);
  const { toast } = useToast();

  // Initialize selected members when dialog opens or members change
  useEffect(() => {
    if (isOpen) {
      setSelectedMembers(members);
    }
  }, [isOpen, members]);

  const toggleMemberSelection = (member: CommunityMember) => {
    setSelectedMembers(prev => {
      const isSelected = prev.some(m => m.id === member.id);
      if (isSelected) {
        return prev.filter(m => m.id !== member.id);
      } else {
        return [...prev, member];
      }
    });
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please provide both subject and message',
        variant: 'destructive',
      });
      return;
    }

    if (selectedMembers.length === 0) {
      toast({
        title: 'No recipients',
        description: 'Please select at least one member',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      // Prepare email recipients
      const recipients = selectedMembers
        .map(m => m.userDetails?.email)
        .filter(email => email); // Filter out undefined emails

      if (recipients.length === 0) {
        toast({
          title: 'No valid email addresses',
          description: 'Selected members do not have email addresses',
          variant: 'destructive',
        });
        setSending(false);
        return;
      }

      console.log('📧 Sending email to:', recipients);
      console.log('📧 Subject:', subject);
      console.log('📧 Message length:', message.length);

      // Convert plain text message to HTML
      const htmlMessage = message.replace(/\n/g, '<br>');

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipients,
          subject: subject,
          html: htmlMessage,
          from: 'dev@kyozo.com',
        }),
      });

      const data = await response.json();
      console.log('📧 API Response:', { status: response.status, data });

      if (response.ok) {
        toast({
          title: 'Emails sent successfully',
          description: `Sent to ${recipients.length} member${recipients.length !== 1 ? 's' : ''}`,
        });
        setSubject('');
        setMessage('');
        onClose();
      } else {
        const errorMsg = data.error || 'Failed to send emails';
        const errorDetails = data.details ? JSON.stringify(data.details, null, 2) : '';
        console.error('❌ Email send failed:', { status: response.status, error: errorMsg, details: errorDetails });
        throw new Error(`${errorMsg}${errorDetails ? ': ' + errorDetails : ''}`);
      }
    } catch (error) {
      console.error('❌ Email send error:', error);
      
      let errorMessage = 'An error occurred while sending emails';
      let errorDescription = '';
      
      if (error instanceof Error) {
        errorMessage = error.message.split(':')[0] || errorMessage;
        errorDescription = error.message.includes(':') ? error.message.split(':').slice(1).join(':').trim() : '';
      }
      
      toast({
        title: errorMessage,
        description: errorDescription || 'Please check the console for more details',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <CustomFormDialog
      open={isOpen}
      onClose={onClose}
      title="Send Email"
      description={`Send email to ${selectedMembers.length} selected member${selectedMembers.length !== 1 ? 's' : ''}`}
      backgroundImage="/bg/light_app_bg.png"
      color={THEME_COLORS.broadcast.primary}
    >
      <div className="flex flex-col h-full">
        <div className="flex-grow grid grid-cols-2 gap-6 overflow-hidden">
          {/* Left side - Compose */}
          <div className="flex flex-col space-y-4 overflow-y-auto pr-2">
            <AIInput
              label="Email Subject"
              value={subject}
              onChange={setSubject}
              placeholder="Enter email subject..."
              aiPrompt={`Generate a professional email subject for a community email${communityName ? ` from ${communityName}` : ''}`}
            />
            
            <AITextarea
              label="Email Message"
              value={message}
              onChange={setMessage}
              placeholder="Compose your email message..."
              rows={12}
              aiPrompt={`Generate a professional, engaging email message for community members${communityName ? ` of ${communityName}` : ''}. The email should be friendly, informative, and encourage engagement.`}
            />
          </div>

          {/* Right side - Selected Members */}
          <div className="flex flex-col overflow-hidden">
            <h3 className="text-sm font-medium text-foreground mb-3">
              Selected Recipients ({selectedMembers.length})
            </h3>
            <div className="flex-grow overflow-y-auto space-y-2 pr-2">
              {members.map((member) => {
                const isSelected = selectedMembers.some(m => m.id === member.id);
                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => toggleMemberSelection(member)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleMemberSelection(member)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.userDetails?.avatarUrl} />
                      <AvatarFallback>
                        {member.userDetails?.displayName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-grow min-w-0">
                      <div className="font-medium text-sm text-foreground truncate">
                        {member.userDetails?.displayName}
                      </div>
                      <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {member.userDetails?.email}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="mt-6 grid grid-cols-2 gap-4 pt-4 border-t">
          <CustomButton
            variant="outline"
            onClick={onClose}
            disabled={sending}
            className="w-full"
          >
            Cancel
          </CustomButton>
          <CustomButton
            variant="outline"
            onClick={handleSend}
            disabled={sending || !subject.trim() || !message.trim()}
            isLoading={sending}
            className="w-full"
          >
            {sending ? 'Sending...' : 'Send Email'}
          </CustomButton>
        </div>
      </div>
    </CustomFormDialog>
  );
}
