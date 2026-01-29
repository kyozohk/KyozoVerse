
'use client';

import React, { useState } from 'react';
import { CustomFormDialog, CustomButton, Textarea } from '@/components/ui';
import { Send } from 'lucide-react';

interface WhatsAppMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientName: string;
  recipientPhone: string;
}

export function WhatsAppMessageDialog({
  open,
  onOpenChange,
  recipientName,
  recipientPhone,
}: WhatsAppMessageDialogProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = () => {
    if (!message.trim()) return;

    setSending(true);

    // Format phone number (remove spaces and special characters)
    const formattedPhone = recipientPhone.replace(/[^\d+]/g, '');
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Open WhatsApp with pre-filled message
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');

    // Reset and close
    setTimeout(() => {
      setMessage('');
      setSending(false);
      onOpenChange(false);
    }, 500);
  };

  const handleClose = () => {
    setMessage('');
    onOpenChange(false);
  };

  return (
    <CustomFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Send WhatsApp Message"
      description={`Send a message to ${recipientName}`}
      color="#25D366" // WhatsApp green
    >
      <div className="flex flex-col h-full gap-4">
        <div className="space-y-4 flex-grow">
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">To:</p>
            <p className="font-medium">{recipientName}</p>
            <p className="text-sm text-muted-foreground">{recipientPhone}</p>
          </div>

          <Textarea
            label="Message"
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className="resize-none"
          />

          <p className="text-xs text-muted-foreground">
            This will open WhatsApp with your message pre-filled. You can edit it before sending.
          </p>
        </div>

        <div className="mt-auto flex flex-row justify-end gap-3 pt-4 border-t" style={{ borderColor: '#E8DFD1' }}>
          <CustomButton
            variant="outline"
            onClick={handleClose}
            disabled={sending}
            className="w-full"
            style={{ borderColor: '#E8DFD1', color: '#5B4A3A' }}
          >
            Cancel
          </CustomButton>
          <CustomButton
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className="w-full"
            style={{ backgroundColor: '#E8DFD1', color: '#5B4A3A', border: 'none' }}
          >
            <Send className="h-4 w-4 mr-2" />
            {sending ? 'Opening...' : 'Send via WhatsApp'}
          </CustomButton>
        </div>
      </div>
    </CustomFormDialog>
  );
}
