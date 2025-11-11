"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CustomButton } from '@/components/ui/CustomButton';
import { AcceptInviteForm } from '@/components/auth/accept-invite-form';
import { useToast } from '@/hooks/use-toast';

interface InviteClientProps {
  token: string;
}

export default function InviteClient({ token }: InviteClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [inviteData, setInviteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyInvite = async () => {
      try {
        setLoading(true);
        // Make sure to trim any whitespace from the token
        const cleanToken = token.trim();
        const response = await fetch(`/api/verify-invite?token=${encodeURIComponent(cleanToken)}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Invalid or expired invite link');
        }

        setInviteData(data.inviteData);
      } catch (err: any) {
        console.error('Error verifying invite:', err);
        setError(err.message || 'Failed to verify invite link');
        toast({
          title: 'Error',
          description: err.message || 'Failed to verify invite link',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    verifyInvite();
  }, [token, toast]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 rounded-lg border border-gray-200 bg-white p-6 shadow-md">
          <h1 className="text-center text-2xl font-bold text-gray-900">Verifying invite...</h1>
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 rounded-lg border border-gray-200 bg-white p-6 shadow-md">
          <h1 className="text-center text-2xl font-bold text-gray-900">Invalid Invite</h1>
          <p className="text-center text-red-500">{error}</p>
          <div className="flex justify-center">
            <CustomButton 
              variant="waitlist" 
              onClick={() => router.push('/')}
            >
              Return to Home
            </CustomButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8 rounded-lg border border-gray-200 bg-white p-6 shadow-md">
        <h1 className="text-center text-2xl font-bold text-gray-900">Complete Your Registration</h1>
        <p className="text-center text-gray-600">
          Welcome to KyozoVerse! Please complete your registration to join our community.
        </p>
        
        {inviteData && (
          <AcceptInviteForm 
            inviteData={inviteData} 
            token={token.trim()} 
          />
        )}
      </div>
    </div>
  );
}
