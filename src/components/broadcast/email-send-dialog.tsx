
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

  // Function to replace variables in text
  const replaceVariables = (text: string, member: CommunityMember): string => {
    return text
      .replace(/\{name\}/g, member.userDetails?.displayName || 'Member')
      .replace(/\{email\}/g, member.userDetails?.email || '')
      .replace(/\{phone\}/g, member.userDetails?.phone || '');
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
      // Send individual emails with personalized content
      const emailPromises = selectedMembers.map(async (member) => {
        const email = member.userDetails?.email;
        if (!email) return null;

        // Replace variables for this specific member
        const personalizedSubject = replaceVariables(subject, member);
        const personalizedMessage = replaceVariables(message, member);
        
        // Convert plain text message to HTML
        const htmlMessage = personalizedMessage.replace(/\n/g, '<br>');

        console.log(`📧 Sending personalized email to: ${email}`);
        console.log(`📧 Subject: ${personalizedSubject}`);

        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: [email],
            subject: personalizedSubject,
            html: htmlMessage,
            from: 'dev@kyozo.com',
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(`Failed to send to ${email}: ${data.error || 'Unknown error'}`);
        }

        return { email, success: true };
      });

      const results = await Promise.all(emailPromises);
      const successCount = results.filter(r => r !== null && r.success).length;

      console.log('📧 Email sending complete:', { successCount, total: selectedMembers.length });

      if (successCount > 0) {
        toast({
          title: 'Emails sent successfully',
          description: `Sent to ${successCount} member${successCount !== 1 ? 's' : ''}`,
        });
        setSubject('');
        setMessage('');
        onClose();
      } else {
        throw new Error('No emails were sent successfully');
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
      onOpenChange={onClose}
      title="Send Email"
      description={`Send email to ${selectedMembers.length} selected member${selectedMembers.length !== 1 ? 's' : ''}`}
      size="large"
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
            
            <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border border-[#C170CF]/20">
              <p className="font-medium mb-1">💡 Personalization Variables:</p>
              <p>Use <code className="bg-background px-1.5 py-0.5 rounded text-[#C170CF]">{'{name}'}</code>, <code className="bg-background px-1.5 py-0.5 rounded text-[#C170CF]">{'{email}'}</code>, or <code className="bg-background px-1.5 py-0.5 rounded text-[#C170CF]">{'{phone}'}</code> to personalize each email</p>
            </div>
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
