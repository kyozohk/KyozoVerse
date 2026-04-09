'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';

interface ConfirmResult {
  success: boolean;
  memberName?: string;
  rsvpName?: string;
  status?: 'accepted' | 'declined';
  error?: string;
}

function RsvpConfirmContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const action = searchParams.get('action');
  const [result, setResult] = useState<ConfirmResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !action) {
      setResult({ success: false, error: 'Invalid confirmation link.' });
      setLoading(false);
      return;
    }

    const confirm = async () => {
      try {
        const res = await fetch(`/api/rsvp/confirm?token=${encodeURIComponent(token)}&action=${encodeURIComponent(action)}`);
        const data = await res.json();
        if (!res.ok) {
          setResult({ success: false, error: data.error || 'Confirmation failed.' });
        } else {
          setResult({ success: true, ...data });
        }
      } catch {
        setResult({ success: false, error: 'Network error. Please try again.' });
      } finally {
        setLoading(false);
      }
    };

    confirm();
  }, [token, action]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#F5F0E8' }}>
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#E07B39' }}>
            <Mail className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-bold" style={{ color: '#5B4A3A' }}>Kyozo</span>
        </div>

        <div className="rounded-2xl p-8 shadow-sm" style={{ backgroundColor: 'white', border: '1px solid #E8DFD1' }}>
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-10 w-10 animate-spin" style={{ color: '#E07B39' }} />
              <p className="text-base" style={{ color: '#8B7355' }}>Confirming your RSVP…</p>
            </div>
          ) : result?.success ? (
            <div className="flex flex-col items-center gap-4 py-4">
              {result.status === 'accepted' ? (
                <>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#dcfce7' }}>
                    <CheckCircle className="h-9 w-9" style={{ color: '#16a34a' }} />
                  </div>
                  <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2" style={{ color: '#5B4A3A' }}>You're in!</h1>
                    <p className="text-base" style={{ color: '#8B7355' }}>
                      Hi <strong style={{ color: '#5B4A3A' }}>{result.memberName}</strong>, your attendance for{' '}
                      <strong style={{ color: '#5B4A3A' }}>{result.rsvpName}</strong> has been confirmed.
                    </p>
                    <p className="text-sm mt-3" style={{ color: '#B0A090' }}>
                      The community organiser will be in touch with further details.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#fee2e2' }}>
                    <XCircle className="h-9 w-9" style={{ color: '#dc2626' }} />
                  </div>
                  <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2" style={{ color: '#5B4A3A' }}>RSVP Declined</h1>
                    <p className="text-base" style={{ color: '#8B7355' }}>
                      Hi <strong style={{ color: '#5B4A3A' }}>{result.memberName}</strong>, your decline for{' '}
                      <strong style={{ color: '#5B4A3A' }}>{result.rsvpName}</strong> has been recorded.
                    </p>
                    <p className="text-sm mt-3" style={{ color: '#B0A090' }}>
                      Changed your mind? Contact the community organiser directly.
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#fef9c3' }}>
                <XCircle className="h-9 w-9" style={{ color: '#ca8a04' }} />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2" style={{ color: '#5B4A3A' }}>Something went wrong</h1>
                <p className="text-base" style={{ color: '#8B7355' }}>{result?.error || 'This link may be invalid or expired.'}</p>
                <p className="text-sm mt-3" style={{ color: '#B0A090' }}>
                  Please contact your community organiser if you need help.
                </p>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#B0A090' }}>
          Powered by <a href="https://kyozo.com" className="underline" style={{ color: '#8B7355' }}>Kyozo</a>
        </p>
      </div>
    </div>
  );
}

export default function RsvpConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F0E8' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#E07B39' }} />
      </div>
    }>
      <RsvpConfirmContent />
    </Suspense>
  );
}
