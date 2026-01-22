'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { db } from '@/firebase/firestore';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { Loader2, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { WaitlistDataTable } from './_components/waitlist-data-table';
import { getColumns, WaitlistRequest } from './_components/waitlist-columns';

export default function WaitlistPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [requests, setRequests] = useState<WaitlistRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    if (!user) return;

    if (user.email !== 'dev@kyozo.com') {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access this page.',
        variant: 'destructive',
      });
      router.push('/communities');
      return;
    }

    const waitlistRef = collection(db, 'waitlist');
    const q = query(waitlistRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WaitlistRequest[];
      
      setRequests(requestsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching waitlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to load waitlist requests',
        variant: 'destructive',
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, router, toast]);

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const response = await fetch('/api/waitlist/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Request Approved',
          description: 'Registration email sent to user',
        });
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
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const response = await fetch('/api/waitlist/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Request Rejected',
          description: 'User has been notified',
        });
      } else {
        throw new Error(data.error || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reject request',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const columns = getColumns(processingId, handleApprove, handleReject);

  return (
    <div className="flex flex-col h-full w-full p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <UserCheck className="w-7 h-7 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Wait List Management</h1>
        </div>
        <p className="text-muted-foreground">Review and manage user access requests</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-lg p-4 border">
          <div className="text-sm text-muted-foreground mb-1">Total Requests</div>
          <div className="text-2xl font-bold text-foreground">{requests.length}</div>
        </div>
        <div className="bg-warning/10 rounded-lg p-4 border border-warning/20">
          <div className="text-sm text-warning-foreground mb-1">Pending</div>
          <div className="text-2xl font-bold text-warning-foreground">{requests.filter(r => r.status === 'pending').length}</div>
        </div>
        <div className="bg-info/10 rounded-lg p-4 border border-info/20">
          <div className="text-sm text-info-foreground mb-1">Approved</div>
          <div className="text-2xl font-bold text-info-foreground">{requests.filter(r => r.status === 'approved').length}</div>
        </div>
        <div className="bg-success/10 rounded-lg p-4 border border-success/20">
          <div className="text-sm text-success-foreground mb-1">Registered</div>
          <div className="text-2xl font-bold text-success-foreground">{requests.filter(r => r.status === 'registered').length}</div>
        </div>
      </div>
      
      <WaitlistDataTable columns={columns} data={requests} />

    </div>
  );
}
