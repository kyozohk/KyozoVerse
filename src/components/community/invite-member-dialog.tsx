
'use client';

import { useState, useEffect } from 'react';
import { CustomFormDialog, Input, CustomButton, Textarea } from '@/components/ui';
import { Mail, MessageCircle, Copy, Check, Loader2 } from 'lucide-react';
import { type Community } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

// KYPRO-77: international phone format sanity check. Requires digits only (optionally
// prefixed with +) and a minimum length so "notaphone" no longer slips through.
const PHONE_RE = /^\+?[0-9\s\-()]{8,20}$/;
// KYPRO-40: we manage placeholder state manually — Input shows a floating label
// AND a placeholder, which overlap. Only show the placeholder when focused.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const { toast } = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  // KYPRO-41 / KYPRO-42: single mutually-exclusive channel instead of two toggles.
  // Defaults to 'email' so the Send button is meaningful on first render.
  const [channel, setChannel] = useState<'email' | 'whatsapp'>('email');
  const [copied, setCopied] = useState(false);
  // KYPRO-44: keep the modal open while submitting and show inline errors instead
  // of closing optimistically + firing a native alert after context is lost.
  const [isSending, setIsSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
      // KYPRO-43: final alert() removed. Show an in-app toast instead and keep
      // the URL in console for easy manual copy.
      console.warn('[KYPRO-43][invite] clipboard_failed', urlToCopy);
      toast({
        title: 'Could not copy link',
        description: 'Please copy it manually from the Invite Link field.',
        variant: 'destructive',
      });
    }
  };

  const handleSendEmail = async (): Promise<{ ok: boolean; error?: string }> => {
    if (!email) return { ok: false, error: 'Please enter an email address.' };
    // KYPRO-43 / KYPRO-40: inline validation, no native alerts.
    if (!EMAIL_RE.test(email)) return { ok: false, error: 'Please enter a valid email address.' };

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
      const response = await fetch('/api/v1/email/send', {
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
          
          const fallbackResponse = await fetch('/api/v1/email/send', {
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
            return { ok: false, error: fallbackData.error || 'Failed to send email.' };
          }

          console.log('✅ Email sent successfully using fallback domain!');
          return { ok: true };
        }
        return { ok: false, error: responseData.error || 'Failed to send email.' };
      }
      console.log('✅ Email sent successfully using community domain!');
      return { ok: true };
    } catch (error: any) {
      console.error('❌ Error sending email:', error);
      return { ok: false, error: error?.message || 'Failed to send email.' };
    }
  };

  const handleSendWhatsApp = (): { ok: boolean; error?: string } => {
    if (!phone) return { ok: false, error: 'Please enter a phone number.' };
    // KYPRO-77: reject obvious garbage like "notaphone". Require digits + optional +.
    if (!PHONE_RE.test(phone)) return { ok: false, error: 'Please enter a valid international phone number (digits, country code optional).' };
    // Final sanity: stripped-digits length between 8 and 15 (E.164).
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15) return { ok: false, error: 'Phone number must be between 8 and 15 digits.' };

    const message = encodeURIComponent(inviteMessage);
    const whatsappUrl = `https://wa.me/${digits}?text=${message}`;
    window.open(whatsappUrl, '_blank');
    return { ok: true };
  };

  const handleSend = async () => {
    setFormError(null);
    // KYPRO-44: validate synchronously first so we don't toggle the loading spinner
    // for pure client-side errors.
    if (!firstName.trim() || !lastName.trim()) {
      setFormError('Please enter first and last name.');
      return;
    }

    setIsSending(true);
    try {
      console.log('[KYPRO-invite] send_start', JSON.stringify({ channel, firstName, lastName, hasEmail: !!email, hasPhone: !!phone }));
      const result = channel === 'email' ? await handleSendEmail() : handleSendWhatsApp();
      if (!result.ok) {
        // KYPRO-44: error shown INSIDE the modal. Nothing gets dismissed.
        setFormError(result.error || 'Something went wrong. Please try again.');
        console.warn('[KYPRO-invite] send_failed', JSON.stringify({ channel, error: result.error }));
        return;
      }
      toast({ title: 'Invite sent', description: channel === 'email' ? `Emailed ${email}.` : `Opened WhatsApp for ${phone}.` });
      console.log('[KYPRO-invite] send_success', JSON.stringify({ channel }));
      // Reset + close only on success.
      setFirstName(''); setLastName(''); setEmail(''); setPhone('');
      setChannel('email'); setFormError(null);
      onClose();
    } finally {
      setIsSending(false);
    }
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
          {/* Name Fields — KYPRO-40: we rely on the floating label; don't pass a
              placeholder prop, which the Input component would stack on top of it.
              If a placeholder is still desired, it can be added at focus time later. */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <Input
              label="Last Name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          {/* KYPRO-41 / KYPRO-42: single exclusive channel. Default is Email.
              Selected channel has a filled style; the other stays outlined. */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: '#8B7355' }}>Send via</label>
            <div className="flex gap-3" role="radiogroup" aria-label="Invite channel">
              {(['email', 'whatsapp'] as const).map(c => {
                const active = channel === c;
                const Icon = c === 'email' ? Mail : MessageCircle;
                return (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => { setChannel(c); setFormError(null); }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all"
                    style={{
                      borderColor: active ? '#5B4A3A' : '#E8DFD1',
                      backgroundColor: active ? '#5B4A3A' : 'white',
                      color: active ? 'white' : '#5B4A3A',
                    }}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{c === 'email' ? 'Email' : 'WhatsApp'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Only the active channel's input is visible — KYPRO-42. */}
          {channel === 'email' && (
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}

          {channel === 'whatsapp' && (
            <Input
              label="Phone Number (with country code)"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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

        {/* KYPRO-44: inline error is rendered just above the action row so the
            user keeps their context and can correct fields without the modal closing. */}
        {formError && (
          <div
            role="alert"
            className="mt-4 px-3 py-2 rounded-md text-sm"
            style={{ backgroundColor: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}
          >
            {formError}
          </div>
        )}

        {/* Action Buttons - Bottom aligned */}
        <div className="flex gap-3 pt-6 mt-4 border-t" style={{ borderColor: '#E8DFD1' }}>
          <CustomButton
            type="button"
            onClick={onClose}
            variant="outline"
            className="flex-1"
            style={{ borderColor: '#E8DFD1', color: '#5B4A3A' }}
            disabled={isSending}
          >
            Cancel
          </CustomButton>
          <CustomButton
            type="button"
            onClick={handleSend}
            className="flex-1"
            style={{ backgroundColor: '#E8DFD1', color: '#5B4A3A', border: 'none' }}
            disabled={isSending}
          >
            {isSending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending…</>
            ) : channel === 'email' ? (
              <><Mail className="h-4 w-4 mr-2" />Send Email Invite</>
            ) : (
              <><MessageCircle className="h-4 w-4 mr-2" />Send WhatsApp Invite</>
            )}
          </CustomButton>
        </div>
      </div>
    </CustomFormDialog>
  );
};
