
'use client';

import { useState, useEffect } from 'react';
import { CustomFormDialog, Input, CustomButton, Textarea } from '@/components/ui';
import { Mail, MessageCircle, Copy, Check } from 'lucide-react';
import { type Community } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';

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
  const { user } = useAuth();
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
      console.log('📧 Sending email to:', email);
      console.log('🏷️ Community handle:', community.handle);
      
      // Use the correct email domain for Willer community
      // The community URL is /wille but email domain should be willer.kyozo.com
      const emailHandle = community.handle === 'wille' ? 'willer' : community.handle;
      const senderEmail = `${community.name} <messages@${emailHandle}.kyozo.com>`;
      console.log('📤 From address:', senderEmail);
      
      // Get community branding colors (fallback to defaults)
      const primaryColor = (community as any).primaryColor || '#843484';
      const bannerImage = community.communityBackgroundImage;
      const logoImage = community.communityProfileImage;
      
      // Simplified HTML content to avoid parsing issues
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 12px; padding: 40px; text-align: center; color: white;">
          <h1 style="color: #ffffff; margin-bottom: 10px; font-size: 28px;">${community.name}</h1>
          ${community.tagline ? `<p style="color: #ff6b35; margin-bottom: 30px; font-size: 16px;">${community.tagline}</p>` : ''}
          <div style="background-color: ${primaryColor}; color: white; padding: 15px 25px; border-radius: 8px; display: inline-block; margin-bottom: 20px;">
            <strong>You're Invited!</strong>
          </div>
          <div style="color: #cccccc; line-height: 1.6; margin-bottom: 25px; white-space: pre-wrap;">${inviteMessage}</div>
          <a href="${inviteUrl}" style="display: inline-block; background-color: ${primaryColor}; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Join ${community.name}</a>
          <div style="border-top: 1px solid #333; padding-top: 20px; margin-top: 30px;">
            <p style="color: #999; font-size: 12px; margin: 0;">Sent via KyozoVerse</p>
          </div>
        </div>
      `;
      
      console.log('📨 Sending email...');
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const idToken = await user.getIdToken();
      
      // Send email via Resend API
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          to: email,
          from: senderEmail,
          subject: `Join ${community.name} on KyozoVerse`,
          html: emailHtml,
        }),
      });

      console.log('📬 Response status:', response.status);
      const responseData = await response.json();
      console.log('📬 Response data:', responseData);

      if (!response.ok) {
        console.error('Email send error:', responseData);
        
        // If the error is related to domain verification, try with fallback domain
        if (responseData.error && (responseData.error.includes('domain') || responseData.error.includes('from'))) {
          console.log('🔄 Community domain not verified, trying fallback domain...');
          
          const fallbackResponse = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              to: email,
              from: 'Kyozo <dev@kyozo.com>',
              subject: `Join ${community.name} on KyozoVerse`,
              html: emailHtml,
            }),
          });
          
          const fallbackData = await fallbackResponse.json();
          console.log('📬 Fallback response:', fallbackData);
          
          if (!fallbackResponse.ok) {
            throw new Error(fallbackData.error || 'Failed to send email');
          }
          
          console.log('✅ Email sent successfully using fallback domain!');
          alert('Invitation email sent successfully!');
        } else {
          throw new Error(responseData.error || 'Failed to send email');
        }
      } else {
        console.log('✅ Email sent successfully using community domain!');
        alert('Invitation email sent successfully!');
      }
    } catch (error) {
      console.error('❌ Error sending email:', error);
      alert(`Failed to send email: ${error.message}`);
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
