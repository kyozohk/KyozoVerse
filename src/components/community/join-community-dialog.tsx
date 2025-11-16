'use client';

import { useState } from 'react';
import { useCommunityAuth } from '@/hooks/use-community-auth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export const JoinCommunityDialog = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
  const { signIn } = useCommunityAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signIn(email);
      toast({
        title: "Check your email!",
        description: `A sign-in link has been sent to ${email}. Click the link to join the community.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending sign-in link:', error);
      toast({
        title: "Error",
        description: "Could not send sign-in link. Please try again.",
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join the Community</DialogTitle>
          <DialogDescription>
            Enter your email to receive a magic link to join this community. No password required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Sending Link...' : 'Send Magic Link'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
