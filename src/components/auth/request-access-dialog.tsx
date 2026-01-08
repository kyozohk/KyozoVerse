
"use client";

import React, { useState } from 'react';
import { CustomFormDialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { CustomButton } from '@/components/ui/CustomButton';
import { PhoneInput } from '@/components/ui/phone-input';
import { X } from 'lucide-react';
import { Mail } from 'lucide-react';
import { THEME_COLORS } from '@/lib/theme-colors';
import { useToast } from '@/hooks/use-toast';
import { PrivacyPolicyDialog } from './privacy-policy-dialog';

interface RequestAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RequestAccessDialog({ open, onOpenChange }: RequestAccessDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [whatsapp, setWhatsapp] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!agreedToPrivacy) {
      toast({
        title: 'Privacy Policy Required',
        description: 'Please agree to the Privacy Policy to continue.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const rawPhone = formData.get('phone') as string;
    // Clean phone number: remove + and spaces
    const cleanPhone = rawPhone.replace(/[\s+]/g, '');
    
    const data = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      phone: cleanPhone,
      email: formData.get('email') as string,
      newsletter,
      whatsapp
    };
    
    try {
      // Send notification email to admin with user data
      const response = await fetch('/api/send-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setUserEmail(data.email);
        setIsSuccess(true);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to submit request. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error submitting access request:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEmail = () => {
    window.open('https://mail.google.com', '_blank');
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after dialog closes
    setTimeout(() => {
      setIsSuccess(false);
      setUserEmail('');
      setNewsletter(false);
      setWhatsapp(false);
    }, 300);
  };
  
  return (
    <>
    <CustomFormDialog
        open={open}
        onClose={handleClose}
        title={isSuccess ? "Request Submitted! ✅" : "Join the Waitlist"}
        description={isSuccess ? "Your request is being reviewed by our team." : "Join the exclusive club of creators, fill up the form and we will get back to you."}
        backgroundImage="/bg/light_app_bg.png"
        color="#843484"
    >
      {isSuccess ? (
        // Success View - Pending Review
        <div className="flex flex-col h-full">
          <div className="flex-grow space-y-6">
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-gray-900">Request Submitted! 🎉</h3>
              <p className="text-gray-600 mb-2">
                Your waitlist request has been sent to:
              </p>
              <p className="text-lg font-medium text-purple-600 mb-6">
                {userEmail}
              </p>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-left">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>What happens next:</strong>
                </p>
                <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                  <li>Our team will review your request</li>
                  <li>You'll receive an email with your login link once approved</li>
                  <li>Use the link to set up your account and start creating!</li>
                </ol>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                This usually takes 24-48 hours. We'll notify you at <strong>{userEmail}</strong>
              </p>
            </div>
          </div>

          <div className="mt-auto">
            <CustomButton 
              onClick={handleClose}
              variant="waitlist" 
              className="w-full"
            >
              Got it, thanks!
            </CustomButton>
          </div>
        </div>
      ) : (
        // Form View
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-grow space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                name="firstName"
                label="Firstname"
                required
              />
              <Input
                name="lastName"
                label="Lastname"
                required
              />
            </div>
            
            <PhoneInput
              name="phone"
              label="Phone"
              required
            />
            
            <Input
              name="email"
              type="email"
              label="Email"
              required
            />
            
            <div className="space-y-2 pt-2">
              <Checkbox
                checked={agreedToPrivacy}
                onCheckedChange={(checked) => setAgreedToPrivacy(checked === true)}
                label={
                  <span className="text-sm text-gray-700">
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowPrivacyDialog(true);
                      }}
                      className="text-primary hover:underline font-medium"
                    >
                      Privacy Policy
                    </button>
                  </span>
                }
              />
              
              <Checkbox
                checked={newsletter}
                onCheckedChange={(checked) => setNewsletter(checked === true)}
                label={
                  <span className="text-sm text-gray-700">Sign me up to the CreativeLab newsletter</span>
                }
              />
              
              <Checkbox
                checked={whatsapp}
                onCheckedChange={(checked) => setWhatsapp(checked === true)}
                label={
                  <span className="text-sm text-gray-700">By submitting this form I agree to be contacted via WhatsApp</span>
                }
              />
            </div>
          </div>
        
          <div className="mt-8">
            <CustomButton 
              type="submit" 
              variant="waitlist" 
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </CustomButton>
          </div>
        </form>
      )}
    </CustomFormDialog>
    
    <PrivacyPolicyDialog 
      open={showPrivacyDialog} 
      onOpenChange={setShowPrivacyDialog}
    />
    </>
  );
}
