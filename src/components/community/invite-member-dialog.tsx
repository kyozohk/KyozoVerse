
'use client';

import { useState, useEffect } from 'react';
import { CustomFormDialog, Input, Button, Textarea } from '@/components/ui';
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
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleSendEmail = () => {
    if (!email) {
      alert('Please enter an email address');
      return;
    }

    const subject = encodeURIComponent(`Join my ${community.name}`);
    const body = encodeURIComponent(inviteMessage);
    const mailtoLink = `mailto:${email}?subject=${subject}&body=${body}`;
    
    window.location.href = mailtoLink;
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
      onClose={onClose}
      title="Invite Member"
      description={`Invite someone to join ${community.name}`}
      backgroundImage="/bg/light_app_bg.png"
      color="#843484"
    >
      <div className="space-y-5">
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
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
                useEmail
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              <Mail className="h-5 w-5" />
              <span className="font-medium">Email</span>
            </button>
            <button
              type="button"
              onClick={() => setUseWhatsApp(!useWhatsApp)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
                useWhatsApp
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
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
            rows={8}
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
            className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-purple-50 transition-colors"
            title="Copy link"
          >
            {copied ? (
              <Check className="h-5 w-5 text-green-600" />
            ) : (
              <Copy className="h-5 w-5 text-[#843484]" />
            )}
          </button>
        </div>
      </div>

      {/* Action Buttons - Bottom aligned */}
      <div className="flex gap-3 pt-6 mt-auto">
        <Button
          type="button"
          onClick={onClose}
          variant="outline"
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSend}
          className="flex-1"
          style={{ backgroundColor: '#843484' }}
        >
          Send Invite
        </Button>
      </div>
    </CustomFormDialog>
  );
};
