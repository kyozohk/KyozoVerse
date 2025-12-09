
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

interface RequestAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RequestAccessDialog({ open, onOpenChange }: RequestAccessDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [whatsapp, setWhatsapp] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
    <CustomFormDialog
        open={open}
        onClose={handleClose}
        title={isSuccess ? "Check Your Email! 📧" : "Join the Waitlist"}
        description={isSuccess ? "We've sent you a login link to get started." : "Join the exclusive club of creators, fill up the form and we will get back to you."}
        backgroundImage="/bg/light_app_bg.png"
        color="#843484"
    >
      {isSuccess ? (
        // Success View
        <div className="flex flex-col h-full">
          <div className="flex-grow space-y-6">
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-gray-900">Welcome to KyozoVerse! 🎉</h3>
              <p className="text-gray-600 mb-2">
                We've sent a login link to:
              </p>
              <p className="text-lg font-medium text-purple-600 mb-6">
                {userEmail}
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Next steps:</strong>
                </p>
                <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                  <li>Check your email inbox</li>
                  <li>Click the login link in the email</li>
                  <li>Setup your community and start creating!</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="mt-auto space-y-3">
            <CustomButton 
              onClick={handleOpenEmail}
              variant="waitlist" 
              className="w-full"
            >
              Open Gmail
            </CustomButton>
            <CustomButton 
              onClick={handleClose}
              variant="outline" 
              className="w-full"
            >
              Close
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
                checked={newsletter}
                onCheckedChange={(checked) => setNewsletter(checked === true)}
                label="Sign me up to the CreativeLab newsletter"
              />
              
              <Checkbox
                checked={whatsapp}
                onCheckedChange={(checked) => setWhatsapp(checked === true)}
                label="By submitting this form I agree to be contacted via WhatsApp"
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
  );
}
