
"use client";

import { useState } from 'react';
import { CustomFormDialog, Input, CustomButton } from '@/components/ui';
import { useAuth } from '@/hooks/use-auth';

export function ResetPasswordDialog({ open, onOpenChange, onGoBack }: { open: boolean, onOpenChange: (open: boolean) => void, onGoBack: () => void }) {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const { resetPassword } = useAuth();

  const handleSubmit = async () => {
    const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    console.log('[ResetPasswordDialog]', JSON.stringify({ requestId, stage: 'submit_start', email: email.replace(/(.{2}).*@/, '$1***@') }));
    
    setError(null);
    if (!email || !email.includes('@')) {
      console.log('[ResetPasswordDialog]', JSON.stringify({ requestId, stage: 'validation_error', reason: 'invalid_email' }));
      setError('Please enter a valid email address.');
      return;
    }
    
    try {
      console.log('[ResetPasswordDialog]', JSON.stringify({ requestId, stage: 'calling_reset_password' }));
      await resetPassword(email);
      console.log('[ResetPasswordDialog]', JSON.stringify({ requestId, stage: 'reset_success', message: 'Password reset email sent successfully' }));
    } catch (error: any) {
      console.error('[ResetPasswordDialog]', JSON.stringify({ 
        requestId, 
        stage: 'reset_error', 
        errorCode: error.code,
        errorMessage: error.message,
        errorName: error.name
      }));
      // Silently catch errors to prevent email enumeration attacks.
      // We show the same "check your inbox" message regardless of whether
      // the email exists in our system or not.
    }
    // Always show submitted state to prevent email enumeration
    console.log('[ResetPasswordDialog]', JSON.stringify({ requestId, stage: 'setting_submitted_state' }));
    setIsSubmitted(true);
  };

  const handleResend = async () => {
    const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    console.log('[ResetPasswordDialog]', JSON.stringify({ requestId, stage: 'resend_start', email: email.replace(/(.{2}).*@/, '$1***@') }));
    
    if (resendStatus === 'sending') {
      console.log('[ResetPasswordDialog]', JSON.stringify({ requestId, stage: 'resend_skipped', reason: 'already_sending' }));
      return;
    }
    
    setResendStatus('sending');
    setError(null);
    
    try {
      console.log('[ResetPasswordDialog]', JSON.stringify({ requestId, stage: 'resend_calling_reset_password' }));
      await resetPassword(email);
      console.log('[ResetPasswordDialog]', JSON.stringify({ requestId, stage: 'resend_success', message: 'Password reset email resent successfully' }));
      setResendStatus('sent');
      setTimeout(() => {
        console.log('[ResetPasswordDialog]', JSON.stringify({ requestId, stage: 'resend_status_reset_to_idle' }));
        setResendStatus('idle');
      }, 5000); // Reset after 5 seconds
    } catch (error: any) {
      console.error('[ResetPasswordDialog]', JSON.stringify({ 
        requestId, 
        stage: 'resend_error', 
        errorCode: error.code,
        errorMessage: error.message,
        errorName: error.name
      }));
      setError(error.message);
      setResendStatus('idle');
    }
  };


  return (
    <CustomFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isSubmitted ? "Check your inbox" : "Reset your password"}
      description={isSubmitted ? `If an account exists for ${email}, we've sent a password reset link. Please check your inbox and spam folder.` : "Enter the email address associated with your account and we'll send you a link to reset your password."}
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
