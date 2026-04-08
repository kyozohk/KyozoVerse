'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2, PartyPopper, CalendarCheck } from 'lucide-react';

interface RsvpResult {
  success: boolean;
  alreadyAccepted?: boolean;
  memberName?: string;
  error?: string;
  message?: string;
}

export default function RsvpAcceptPage() {
  const params = useParams();
  const token = params.token as string;
  const [status, setStatus] = useState<'loading' | 'success' | 'already' | 'error' | 'expired'>('loading');
  const [result, setResult] = useState<RsvpResult | null>(null);

  useEffect(() => {
    const acceptRsvp = async () => {
      try {
        const response = await fetch('/api/rsvp/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          if (data.alreadyAccepted) {
            setStatus('already');
          } else {
            setStatus('success');
          }
          setResult(data);
        } else if (response.status === 410) {
          setStatus('expired');
          setResult(data);
        } else {
          setStatus('error');
          setResult(data);
        }
      } catch (error) {
        console.error('Error accepting RSVP:', error);
        setStatus('error');
        setResult({ success: false, error: 'Network error. Please try again.' });
      }
    };

    if (token) {
      acceptRsvp();
    }
  }, [token]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F5F0E8',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      padding: '20px',
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        backgroundColor: 'white',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
        textAlign: 'center',
      }}>
        {status === 'loading' && (
          <div style={{ padding: '60px 32px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Loader2
                style={{ width: '48px', height: '48px', color: '#E07B39', animation: 'spin 1s linear infinite' }}
              />
            </div>
            <h2 style={{ color: '#5B4A3A', fontSize: '22px', fontWeight: 600, marginBottom: '8px' }}>
              Confirming your RSVP...
            </h2>
            <p style={{ color: '#8B7355', fontSize: '15px' }}>
              Please wait while we process your response.
            </p>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {status === 'success' && (
          <>
            <div style={{ backgroundColor: '#E07B39', padding: '40px 32px' }}>
              <PartyPopper style={{ width: '48px', height: '48px', color: 'white', margin: '0 auto 12px', display: 'block' }} />
              <h2 style={{ color: 'white', fontSize: '26px', fontWeight: 700, margin: 0 }}>
                You're In!
              </h2>
            </div>
            <div style={{ padding: '32px' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: '#E8F5E9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <CheckCircle2 style={{ width: '40px', height: '40px', color: '#4CAF50' }} />
              </div>
              <h3 style={{ color: '#5B4A3A', fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
                Thanks{result?.memberName ? `, ${result.memberName}` : ''}!
              </h3>
              <p style={{ color: '#6B5D52', fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
                Your RSVP has been confirmed. The organizer has been notified that you'll be attending.
              </p>
              <div style={{
                backgroundColor: '#FAF8F5',
                border: '1px solid #E8DFD1',
                borderRadius: '12px',
                padding: '16px',
              }}>
                <CalendarCheck style={{ width: '24px', height: '24px', color: '#E07B39', margin: '0 auto 8px', display: 'block' }} />
                <p style={{ color: '#8B7355', fontSize: '13px', margin: 0 }}>
                  You can close this page now. See you there!
                </p>
              </div>
            </div>
          </>
        )}

        {status === 'already' && (
          <>
            <div style={{ backgroundColor: '#5B4A3A', padding: '40px 32px' }}>
              <CalendarCheck style={{ width: '48px', height: '48px', color: 'white', margin: '0 auto 12px', display: 'block' }} />
              <h2 style={{ color: 'white', fontSize: '26px', fontWeight: 700, margin: 0 }}>
                Already Confirmed
              </h2>
            </div>
            <div style={{ padding: '32px' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: '#E3F2FD',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <CheckCircle2 style={{ width: '40px', height: '40px', color: '#2196F3' }} />
              </div>
              <h3 style={{ color: '#5B4A3A', fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
                Hi{result?.memberName ? ` ${result.memberName}` : ''}!
              </h3>
              <p style={{ color: '#6B5D52', fontSize: '15px', lineHeight: 1.6 }}>
                You've already accepted this invitation. No further action needed — we'll see you there!
              </p>
            </div>
          </>
        )}

        {status === 'expired' && (
          <>
            <div style={{ backgroundColor: '#8B7355', padding: '40px 32px' }}>
              <h2 style={{ color: 'white', fontSize: '26px', fontWeight: 700, margin: 0 }}>
                Link Expired
              </h2>
            </div>
            <div style={{ padding: '32px' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: '#FFF3E0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <XCircle style={{ width: '40px', height: '40px', color: '#FF9800' }} />
              </div>
              <p style={{ color: '#6B5D52', fontSize: '15px', lineHeight: 1.6 }}>
                This RSVP link has expired. Please contact the event organizer for a new invitation.
              </p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ backgroundColor: '#D32F2F', padding: '40px 32px' }}>
              <h2 style={{ color: 'white', fontSize: '26px', fontWeight: 700, margin: 0 }}>
                Something Went Wrong
              </h2>
            </div>
            <div style={{ padding: '32px' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: '#FFEBEE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <XCircle style={{ width: '40px', height: '40px', color: '#D32F2F' }} />
              </div>
              <p style={{ color: '#6B5D52', fontSize: '15px', lineHeight: 1.6 }}>
                {result?.error || 'We couldn\'t process your RSVP. Please try again or contact the event organizer.'}
              </p>
            </div>
          </>
        )}

        <div style={{
          backgroundColor: '#FAF8F5',
          padding: '16px',
          borderTop: '1px solid #E8DFD1',
        }}>
          <p style={{ color: '#8B7355', fontSize: '12px', margin: 0 }}>
            Powered by <strong>Kyozo</strong>
          </p>
        </div>
      </div>
    </div>
  );
}