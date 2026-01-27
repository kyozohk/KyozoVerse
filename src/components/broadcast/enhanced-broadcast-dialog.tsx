'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Mail, MessageSquare, Send, Loader2, Plus, FileText, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EnhancedListView } from '@/components/v2/enhanced-list-view';
import { MemberGridItem, MemberListItem, MemberCircleItem } from '@/components/v2/member-items';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface MemberData {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  imageUrl: string;
  role?: string;
  joinedDate?: any;
  tags?: string[];
}

interface BroadcastTemplate {
  id: string;
  name: string;
  subject?: string;
  message: string;
  type: 'email' | 'whatsapp' | 'both';
  createdAt?: any;
}

interface EnhancedBroadcastDialogProps {
  isOpen: boolean;
  onClose: () => void;
  members: MemberData[];
  initialSelectedMembers?: MemberData[];
  communityName?: string;
  fromEmail?: string;
}

type BroadcastMode = 'email' | 'whatsapp';

export function EnhancedBroadcastDialog({
  isOpen,
  onClose,
  members,
  initialSelectedMembers,
  communityName,
  fromEmail = 'dev@kyozo.com'
}: EnhancedBroadcastDialogProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<BroadcastMode>('email');
  const [selectedMembers, setSelectedMembers] = useState<MemberData[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [templates, setTemplates] = useState<BroadcastTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<BroadcastTemplate | null>(null);

  // Fetch templates from Firebase
  const fetchTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);
    try {
      const templatesRef = collection(db, 'broadcastTemplates');
      const snapshot = await getDocs(templatesRef);
      const templatesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BroadcastTemplate[];
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setIsLoadingTemplates(false);
    }
  }, []);

  // Initialize when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedMembers(initialSelectedMembers || members);
      setSubject('');
      setMessage('');
      setSelectedTemplate(null);
      fetchTemplates();
    }
  }, [isOpen, members, initialSelectedMembers, fetchTemplates]);

  // Handle template selection
  const handleSelectTemplate = (template: BroadcastTemplate) => {
    setSelectedTemplate(template);
    setSubject(template.subject || '');
    setMessage(template.message);
  };

  // Save current message as template
  const handleSaveAsTemplate = async () => {
    if (!newTemplateName.trim() || !message.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter a template name and message.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await addDoc(collection(db, 'broadcastTemplates'), {
        name: newTemplateName,
        subject: subject,
        message: message,
        type: mode,
        createdAt: serverTimestamp(),
      });

      toast({
        title: 'Template Saved',
        description: 'Your template has been saved successfully.',
      });

      setNewTemplateName('');
      setIsCreatingTemplate(false);
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Error',
        description: 'Failed to save template. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSendBroadcast = async () => {
    if (selectedMembers.length === 0) {
      toast({
        title: 'No Recipients',
        description: 'Please select at least one member.',
        variant: 'destructive',
      });
      return;
    }

    if (mode === 'email' && (!subject.trim() || !message.trim())) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in both subject and message.',
        variant: 'destructive',
      });
      return;
    }

    if (mode === 'whatsapp' && !message.trim()) {
      toast({
        title: 'Missing Message',
        description: 'Please enter a message.',
        variant: 'destructive',
      });
      return;
    }

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

    for (const member of membersWithEmail) {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    const membersWithPhone = selectedMembers.filter(m => m.phone && m.phone.trim());
    
    if (membersWithPhone.length === 0) {
      throw new Error('No selected members have phone numbers');
    }

    // TODO: Implement actual WhatsApp API
    toast({
      title: 'Coming Soon',
      description: 'WhatsApp broadcasting will be available soon.',
    });
  };

  const onSelectionChange = useCallback((ids: Set<string>, items: MemberData[]) => {
    setSelectedMembers(items);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1200px] max-h-[90vh] p-0 overflow-hidden" style={{ backgroundColor: '#F5F0E8' }}>
        <div className="flex h-[80vh]">
          {/* Left Panel - Compose Message */}
          <div className="flex-1 flex flex-col border-r" style={{ borderColor: '#E8DFD1' }}>
            <DialogHeader className="p-6 pb-4">
              <DialogTitle style={{ color: '#5B4A3A' }}>Send Broadcast</DialogTitle>
              <DialogDescription>
                Send a message to {selectedMembers.length} selected member{selectedMembers.length === 1 ? '' : 's'}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6">
              {/* Mode Toggle */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant={mode === 'email' ? 'default' : 'outline'}
                  onClick={() => setMode('email')}
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
                  style={{ 
                    backgroundColor: mode === 'whatsapp' ? '#25D366' : 'transparent',
                    borderColor: '#E8DFD1',
                    color: mode === 'whatsapp' ? 'white' : '#5B4A3A'
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
              </div>

              {/* Templates Section */}
              <div className="mb-4">
                <Label className="text-sm font-medium mb-2 block" style={{ color: '#5B4A3A' }}>
                  Templates
                </Label>
                <ScrollArea className="w-full whitespace-nowrap">
                  <div className="flex gap-2 pb-2">
                    {isLoadingTemplates ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading templates...
                      </div>
                    ) : (
                      <>
                        {templates.map((template) => (
                          <Button
                            key={template.id}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectTemplate(template)}
                            className={cn(
                              "shrink-0 gap-1.5",
                              selectedTemplate?.id === template.id && "ring-2 ring-ring"
                            )}
                            style={{ 
                              borderColor: '#E8DFD1',
                              backgroundColor: selectedTemplate?.id === template.id ? '#E8DFD1' : 'white'
                            }}
                          >
                            <FileText className="h-3.5 w-3.5" />
                            {template.name}
                            {selectedTemplate?.id === template.id && (
                              <Check className="h-3.5 w-3.5 text-green-600" />
                            )}
                          </Button>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsCreatingTemplate(true)}
                          className="shrink-0 gap-1.5"
                          style={{ 
                            borderColor: '#5B4A3A',
                            backgroundColor: '#5B4A3A',
                            color: 'white'
                          }}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          New Template
                        </Button>
                      </>
                    )}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>

                {/* Create Template Form */}
                {isCreatingTemplate && (
                  <div className="mt-3 p-3 border rounded-lg" style={{ backgroundColor: 'white', borderColor: '#E8DFD1' }}>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label htmlFor="templateName" className="text-xs" style={{ color: '#5B4A3A' }}>
                          Template Name
                        </Label>
                        <Input
                          id="templateName"
                          placeholder="Enter template name..."
                          value={newTemplateName}
                          onChange={(e) => setNewTemplateName(e.target.value)}
                          className="h-8 text-sm"
                          style={{ backgroundColor: 'white', borderColor: '#E8DFD1' }}
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={handleSaveAsTemplate}
                        style={{ backgroundColor: '#5B4A3A', color: 'white' }}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsCreatingTemplate(false);
                          setNewTemplateName('');
                        }}
                        style={{ borderColor: '#E8DFD1' }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Subject (Email only) */}
              {mode === 'email' && (
                <div className="mb-4">
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

              {/* Message */}
              <div className="mb-4">
                <Label htmlFor="message" style={{ color: '#5B4A3A' }}>Message</Label>
                <Textarea
                  id="message"
                  placeholder="Enter your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={8}
                  style={{ backgroundColor: 'white', borderColor: '#E8DFD1' }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 pt-4 border-t flex justify-between items-center" style={{ borderColor: '#E8DFD1' }}>
              <Button
                variant="outline"
                onClick={onClose}
                style={{ borderColor: '#E8DFD1', color: '#5B4A3A' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendBroadcast}
                disabled={isSending || selectedMembers.length === 0}
                style={{ backgroundColor: '#5B4A3A', color: 'white' }}
              >
                {isSending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="mr-2 h-4 w-4" /> Send to {selectedMembers.length} Member{selectedMembers.length === 1 ? '' : 's'}</>
                )}
              </Button>
            </div>
          </div>

          {/* Right Panel - Member Selection */}
          <div className="w-[600px] flex flex-col" style={{ backgroundColor: '#FAF8F5' }}>
            <div className="p-4 border-b" style={{ borderColor: '#E8DFD1' }}>
              <h3 className="font-medium" style={{ color: '#5B4A3A' }}>Recipients</h3>
              <p className="text-sm text-muted-foreground">
                {selectedMembers.length} of {members.length} selected
              </p>
            </div>
            <div className="flex-1 overflow-hidden">
              <EnhancedListView
                items={members}
                renderGridItem={(item, isSelected, onSelect, urlField, selectable) => (
                  <MemberGridItem item={item} isSelected={isSelected} selectable={selectable} />
                )}
                renderListItem={(item, isSelected, onSelect, urlField, selectable) => (
                  <MemberListItem item={item} isSelected={isSelected} selectable={selectable} />
                )}
                renderCircleItem={(item, isSelected, onSelect, urlField, selectable) => (
                  <MemberCircleItem item={item} isSelected={isSelected} selectable={selectable} />
                )}
                searchKeys={['name', 'email']}
                selectable={true}
                onSelectionChange={onSelectionChange}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
