"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { CustomButton } from '@/components/ui/CustomButton';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RequestAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RequestAccessDialog({ open, onOpenChange }: RequestAccessDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [whatsapp, setWhatsapp] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      phone: formData.get('phone') as string,
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
        const testInviteLink = result.testInviteLink || `${window.location.origin}/invite/${btoa(data.email)}`;
        
        toast({
          title: 'Request Submitted',
          description: result.message || 'Your request has been submitted successfully!',
        });
        
        // Show alert with invite link and email info for testing
        const emailInfo = result.emailSent ? 
          `\n\nEmails sent to:\n- Admin: ${result.emailDetails?.adminEmail}\n- User: ${result.emailDetails?.userEmail}` : 
          '\n\nNo emails were sent.';
        
        alert(`Test Invite Link: ${testInviteLink}${emailInfo}\n\nThis is a test link for development purposes.`);
        
        onOpenChange(false); // Close dialog on success
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
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light">Request to Join</DialogTitle>
          <button 
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>
        
        <p className="text-sm text-muted-foreground mb-4">
          Enter your email to request access to our platform.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              name="firstName"
              label="Firstname"
              placeholder="Firstname"
              required
            />
            <Input
              name="lastName"
              label="Lastname"
              placeholder="Lastname"
              required
            />
          </div>
          
          <Input
            name="phone"
            label="Phone"
            placeholder="Phone"
            required
          />
          
          <Input
            name="email"
            label="Email"
            placeholder="Email"
            type="email"
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
          
          <div className="pt-4">
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
      </DialogContent>
    </Dialog>
  );
}
