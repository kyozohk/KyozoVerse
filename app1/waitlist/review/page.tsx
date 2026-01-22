'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, UserCheck, Mail, Phone, Clock, CheckCircle, ListChecks } from 'lucide-react';
import { CustomButton } from '@/components/ui/CustomButton';
import { useToast } from '@/hooks/use-toast';

interface UserData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  newsletter: boolean;
  whatsapp: boolean;
  timestamp: string;
}

export default function WaitlistReviewPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [processing, setProcessing] = useState(false);
  const [action, setAction] = useState<'approve' | 'waitlist' | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    if (!user) return;

    // Check if user is admin
    if (user.email !== 'dev@kyozo.com') {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access this page.',
        variant: 'destructive',
      });
      router.push('/communities');
      return;
    }

    // Decode user data from URL
    const encodedData = searchParams.get('data');
    if (!encodedData) {
      toast({
        title: 'Invalid Link',
        description: 'No request data found in the link.',
        variant: 'destructive',
      });
      router.push('/waitlist');
      return;
    }

    try {
      const decodedData = JSON.parse(atob(encodedData));
      setUserData(decodedData);
    } catch (error) {
      console.error('Error decoding data:', error);
      toast({
        title: 'Invalid Link',
        description: 'Could not decode request data.',
        variant: 'destructive',
      });
      router.push('/waitlist');
    }
  }, [user, authLoading, router, searchParams, toast]);

  const handleApprove = async () => {
    if (!userData) return;
    
    setProcessing(true);
    setAction('approve');
    
    try {
      const response = await fetch('/api/waitlist/approve-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Request Approved',
          description: 'Registration email sent to user',
        });
        router.push('/waitlist');
      } else {
        throw new Error(data.error || 'Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve request',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
      setAction(null);
    }
  };

  const handleWaitlist = async () => {
    if (!userData) return;
    
    setProcessing(true);
    setAction('waitlist');
    
    try {
      const response = await fetch('/api/waitlist/add-to-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Added to Waitlist',
          description: 'Request has been added to the waitlist for later review',
        });
        router.push('/waitlist');
      } else {
        throw new Error(data.error || 'Failed to add to waitlist');
      }
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add to waitlist',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
      setAction(null);
    }
  };

  if (authLoading || !userData) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const requestDate = new Date(userData.timestamp);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full p-8">
      <div className="max-w-2xl w-full bg-white rounded-lg border border-gray-200 shadow-lg p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
          <UserCheck className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Review Waitlist Request</h1>
            <p className="text-sm text-gray-600">Decide whether to approve or waitlist this user</p>
          </div>
        </div>

        {/* User Information */}
        <div className="space-y-6 mb-8">
          <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
            <h2 className="text-lg font-semibold text-purple-900 mb-4">User Information</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-purple-600 font-medium text-lg">
                    {userData.firstName.charAt(0)}{userData.lastName.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="text-lg font-medium text-gray-900">
                    {userData.firstName} {userData.lastName}
                  </div>
                  <div className="text-sm text-gray-600">Requested access</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-4 border-t border-purple-200">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Email</div>
                    <div className="text-sm font-medium text-gray-900">{userData.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Phone</div>
                    <div className="text-sm font-medium text-gray-900">{userData.phone}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Requested</div>
                    <div className="text-sm font-medium text-gray-900">
                      {requestDate.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Communication Preferences */}
          {(userData.newsletter || userData.whatsapp) && (
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <h3 className="text-sm font-semibold text-yellow-900 mb-2">Communication Preferences</h3>
              <div className="space-y-1 text-sm text-yellow-800">
                {userData.newsletter && <div>✓ Opted in to CreativeLab newsletter</div>}
                {userData.whatsapp && <div>✓ Agreed to WhatsApp contact</div>}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <CustomButton
            onClick={handleApprove}
            disabled={processing}
            variant="rounded-rect"
            className="flex-1 !bg-green-600 hover:!bg-green-700 !text-white !py-4"
          >
            {processing && action === 'approve' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Approve & Send Registration Email
              </>
            )}
          </CustomButton>

          <CustomButton
            onClick={handleWaitlist}
            disabled={processing}
            variant="rounded-rect"
            className="flex-1 !bg-yellow-600 hover:!bg-yellow-700 !text-white !py-4"
          >
            {processing && action === 'waitlist' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Adding...
              </>
            ) : (
              <>
                <ListChecks className="w-5 h-5 mr-2" />
                Add to Waitlist for Later
              </>
            )}
          </CustomButton>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          <strong>Approve:</strong> User gets registration email immediately • 
          <strong> Waitlist:</strong> Saved for later review in the waitlist dashboard
        </p>
      </div>
    </div>
  );
}
