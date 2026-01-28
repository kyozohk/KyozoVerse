
'use client';

import { useState, useEffect } from 'react';
import { CustomFormDialog, Input, CustomButton, Textarea } from '@/components/ui';
import { Mail, MessageCircle, Copy, Check } from 'lucide-react';
import { type Community } from '@/lib/types';

interface InviteMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  community: Community;
}

export const InviteMemberDialog: React.FC<InviteMemberDialogProps> = ({
  isOpen,
  onClose,
  community
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [useEmail, setUseEmail] = useState(false);
  const [useWhatsApp, setUseWhatsApp] = useState(false);
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');

  // Build invite URL and message when fields change
  useEffect(() => {
    const params = new URLSearchParams();
    if (firstName) params.append('firstName', firstName);
    if (lastName) params.append('lastName', lastName);
    if (email) params.append('email', email);
    if (phone) params.append('phone', phone);
    
    const url = `${baseUrl}/${community.handle}/join${params.toString() ? '?' + params.toString() : ''}`;
    setInviteUrl(url);
    
    const message = `Hi ${firstName || 'there'}! 

You're invited to join ${community.name} on KyozoVerse! 

${community.lore || 'Join our community to access exclusive content and connect with other members.'}

Click the link below to sign up:
${url}

Looking forward to seeing you there!`;
    
    setInviteMessage(message);
  }, [firstName, lastName, email, phone, community.name, community.lore, community.handle, baseUrl]);

  const handleCopyLink = async () => {
    // Build the URL fresh to ensure we have the latest values
    const params = new URLSearchParams();
    if (firstName) params.append('firstName', firstName);
    if (lastName) params.append('lastName', lastName);
    if (email) params.append('email', email);
    if (phone) params.append('phone', phone);
    
    const urlToCopy = `${baseUrl}/${community.handle}/join${params.toString() ? '?' + params.toString() : ''}`;
    
    console.log('📋 COPY - Attempting to copy invite URL:', urlToCopy);
    console.log('📋 COPY - Form values:', { firstName, lastName, email, phone });
    console.log('📋 COPY - Clipboard API available:', !!(navigator.clipboard && navigator.clipboard.writeText));
    
    try {
      // Check if clipboard API is available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        console.log('📋 COPY - Using clipboard API');
        await navigator.clipboard.writeText(urlToCopy);
        console.log('✅ COPY - Successfully copied using clipboard API');
        console.log('📋 COPY - Copied text:', urlToCopy);
        
        // Verify what's in clipboard
        try {
          const clipboardText = await navigator.clipboard.readText();
          console.log('📋 COPY - Verified clipboard contents:', clipboardText);
        } catch (e) {
          console.log('📋 COPY - Cannot read clipboard (permission denied)');
        }
        
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback for browsers that don't support clipboard API
        console.log('📋 COPY - Using fallback method (execCommand)');
        const textArea = document.createElement('textarea');
        textArea.value = urlToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        console.log('📋 COPY - TextArea value before copy:', textArea.value);
        
        try {
          const successful = document.execCommand('copy');
          console.log('📋 COPY - execCommand result:', successful);
          if (successful) {
            console.log('✅ COPY - Successfully copied using execCommand');
            console.log('📋 COPY - Copied text:', textArea.value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } else {
            throw new Error('Copy command failed');
          }
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      console.error('❌ COPY - Failed to copy:', error);
      // Show user-friendly error message
      alert('Failed to copy link. Please copy it manually: ' + urlToCopy);
    }
  };

  const handleSendEmail = async () => {
    if (!email) {
      alert('Please enter an email address');
      return;
    }

    try {
      // Use community handle domain for sending emails
      // Format: Community Name <messages@handle.kyozo.com>
      const senderEmail = `${community.name} <messages@${community.handle}.kyozo.com>`;
      
      // Get community branding colors (fallback to defaults)
      const primaryColor = (community as any).primaryColor || '#843484';
      const bannerImage = community.communityBackgroundImage;
      const logoImage = community.communityProfileImage;
      
      // Send email via Resend API
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          from: senderEmail,
          subject: `Join ${community.name} on KyozoVerse`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  ${bannerImage ? `
                  <div style="width: 100%; height: 180px; background-image: url('${bannerImage}'); background-size: cover; background-position: center; position: relative;">
                    <div style="position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.6));"></div>
                    ${logoImage ? `
                    <div style="position: absolute; bottom: -40px; left: 24px;">
                      <img src="${logoImage}" alt="${community.name}" style="width: 80px; height: 80px; border-radius: 50%; border: 4px solid white; object-fit: cover;" />
                    </div>
                    ` : ''}
                  </div>
                  ` : ''}
                  <div style="padding: ${bannerImage ? '50px 24px 24px' : '24px'};">
                    <h1 style="color: #1f2937; margin-bottom: 8px; font-size: 24px;">${community.name}</h1>
                    ${community.tagline ? `<p style="color: #6b7280; margin-bottom: 20px; font-size: 14px;">${community.tagline}</p>` : ''}
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                    <h2 style="color: #1f2937; margin-bottom: 16px; font-size: 20px;">You're Invited!</h2>
                    <div style="white-space: pre-wrap; color: #4b5563; line-height: 1.6; margin-bottom: 24px; font-size: 14px;">${inviteMessage}</div>
                    <a href="${inviteUrl}" style="display: inline-block; background-color: ${primaryColor}; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Join ${community.name}</a>
                  </div>
                  <div style="background-color: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">Sent via KyozoVerse</p>
                  </div>
                </div>
              </body>
            </html>
          `,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Email send error:', errorData);
        throw new Error(errorData.error || 'Failed to send email');
      }

      alert('Invitation email sent successfully!');
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email. Please try again.');
    }
  };

  const handleSendWhatsApp = () => {
    if (!phone) {
      alert('Please enter a phone number');
      return;
    }

    // Remove all non-numeric characters from phone
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(inviteMessage);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const handleSend = () => {
    if (!useEmail && !useWhatsApp) {
      alert('Please select at least one method (Email or WhatsApp)');
      return;
    }

    if (!firstName || !lastName) {
      alert('Please enter first and last name');
      return;
    }

    if (useEmail) {
      handleSendEmail();
    }

    if (useWhatsApp) {
      handleSendWhatsApp();
    }

    // Close dialog after sending
    setTimeout(() => {
      onClose();
      // Reset form
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setUseEmail(false);
      setUseWhatsApp(false);
    }, 500);
  };

  return (
    <CustomFormDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Invite Member"
      description={`Invite someone to join ${community.name}`}
    >
      <div className="flex flex-col h-full">
        <div className="flex-grow space-y-5 overflow-y-auto">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
            />
            <Input
              label="Last Name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
            />
          </div>

          {/* Invite Method Toggle Buttons */}
          <div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setUseEmail(!useEmail)}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all"
                style={{
                  borderColor: useEmail ? '#5B4A3A' : '#E8DFD1',
                  backgroundColor: useEmail ? '#F5F0E8' : 'white',
                  color: '#5B4A3A'
                }}
              >
                <Mail className="h-5 w-5" />
                <span className="font-medium">Email</span>
              </button>
              <button
                type="button"
                onClick={() => setUseWhatsApp(!useWhatsApp)}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all"
                style={{
                  borderColor: useWhatsApp ? '#5B4A3A' : '#E8DFD1',
                  backgroundColor: useWhatsApp ? '#F5F0E8' : 'white',
                  color: '#5B4A3A'
                }}
              >
                <MessageCircle className="h-5 w-5" />
                <span className="font-medium">WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Email Input (conditional) */}
          {useEmail && (
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
            />
          )}

          {/* Phone Input (conditional) */}
          {useWhatsApp && (
            <Input
              label="Phone Number (with country code)"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1234567890"
            />
          )}

          {/* Editable Message */}
          <div>
            <Textarea
              label="Invite Message"
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              rows={6}
              placeholder="Enter your invite message..."
            />
          </div>

          {/* Invite Link */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Input
                label="Invite Link"
                type="text"
                value={inviteUrl}
                readOnly
              />
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="h-10 w-10 flex items-center justify-center rounded-lg transition-colors"
              style={{ backgroundColor: copied ? '#E8DFD1' : 'transparent' }}
              title="Copy link"
            >
              {copied ? (
                <Check className="h-5 w-5" style={{ color: '#5B4A3A' }} />
              ) : (
                <Copy className="h-5 w-5" style={{ color: '#5B4A3A' }} />
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons - Bottom aligned */}
        <div className="flex gap-3 pt-6 mt-4 border-t" style={{ borderColor: '#E8DFD1' }}>
          <CustomButton
            type="button"
            onClick={onClose}
            variant="outline"
            className="flex-1"
            style={{ borderColor: '#E8DFD1', color: '#5B4A3A' }}
          >
            Cancel
          </CustomButton>
          <CustomButton
            type="button"
            onClick={handleSend}
            className="flex-1"
            style={{ backgroundColor: '#E8DFD1', color: '#5B4A3A', border: 'none' }}
          >
            <Mail className="h-4 w-4 mr-2" />
            Send Invite
          </CustomButton>
        </div>
      </div>
    </CustomFormDialog>
  );
};
