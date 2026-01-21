
"use client";

import { useState } from 'react';
import { CustomFormDialog, Input, CustomButton } from '@/components/ui';
import { useAuth } from '@/hooks/use-auth';
import { THEME_COLORS } from '@/lib/theme-colors';

export function ResetPasswordDialog({ open, onClose, onGoBack }: { open: boolean, onClose: () => void, onGoBack: () => void }) {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const { resetPassword } = useAuth();

  const handleSubmit = async () => {
    setError(null);
    try {
      await resetPassword(email);
      setIsSubmitted(true);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleResend = async () => {
    if (resendStatus === 'sending') return;
    setResendStatus('sending');
    setError(null);
    try {
      await resetPassword(email);
      setResendStatus('sent');
      setTimeout(() => setResendStatus('idle'), 5000); // Reset after 5 seconds
    } catch (error: any) {
      setError(error.message);
      setResendStatus('idle');
    }
  };


  return (
    <CustomFormDialog
      open={open}
      onClose={onClose}
      title={isSubmitted ? "Check your inbox" : "Reset your password"}
      description={isSubmitted ? `We've sent a password reset link to ${email}.` : "Enter the email address associated with your account and we'll send you a link to reset your password."}
      backgroundImage="/bg/light_app_bg.png"
      color={THEME_COLORS.overview.primary}
    >
      <div className="flex flex-col h-full">
        {!isSubmitted ? (
          <>
            <div className="flex-grow overflow-y-auto pr-2">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>
            <div className="mt-8 flex-shrink-0">
              <div className="mb-4">
                <CustomButton 
                  onClick={handleSubmit} 
                  className="w-full py-3 text-base font-medium" 
                  variant="waitlist"
                >
                  Send reset link
                </CustomButton>
              </div>
              <div className="text-center text-sm">
                <button type="button" className="text-primary hover:underline" onClick={onGoBack}>
                  Go back
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-grow flex items-center justify-center">
            <div className="text-center text-sm text-muted-foreground">
                Didn't receive the email?{' '}
                <button type="button" className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleResend} disabled={resendStatus === 'sending' || resendStatus === 'sent'}>
                  {resendStatus === 'idle' && 'Resend'}
                  {resendStatus === 'sending' && 'Sending...'}
                  {resendStatus === 'sent' && 'Sent!'}
                </button>
            </div>
          </div>
        )}
      </div>
    </CustomFormDialog>
  );
}
