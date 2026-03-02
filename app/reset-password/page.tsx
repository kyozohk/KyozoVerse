'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { confirmPasswordReset } from 'firebase/auth';
import { auth } from '@/firebase/auth';
import { CustomButton, Input, PasswordInput } from '@/components/ui';
import { CheckCircle2, Loader2 } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [oobCode, setOobCode] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('oobCode');
    const mode = searchParams.get('mode');

    if (!code || mode !== 'resetPassword') {
      setError('Invalid or expired password reset link.');
    } else {
      setOobCode(code);
    }
  }, [searchParams]);

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    return null;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!oobCode) {
      setError('Invalid reset link');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);
      
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (error: any) {
      console.error('Password reset error:', error);
      let errorMessage = 'Failed to reset password. Please try again.';
      
      if (error.code === 'auth/expired-action-code') {
        errorMessage = 'This password reset link has expired. Please request a new one.';
      } else if (error.code === 'auth/invalid-action-code') {
        errorMessage = 'This password reset link is invalid or has already been used.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md bg-card rounded-2xl p-8 shadow-lg">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Password Reset Successful!</h1>
            <p className="text-muted-foreground mb-6">
              Your password has been updated successfully. You will be redirected to the homepage shortly.
            </p>
            <CustomButton onClick={() => router.push('/')} className="w-full">
              Go to Homepage
            </CustomButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card rounded-2xl p-8 shadow-lg">
        <div className="text-center mb-8">
          <img src="/logo.svg" alt="Kyozo Logo" className="h-10 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-foreground">Reset Your Password</h1>
          <p className="text-muted-foreground mt-2">
            Enter your new password below
          </p>
        </div>

        {error && !oobCode ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-600">
              {error}
            </div>
            <CustomButton onClick={() => router.push('/')} className="w-full">
              Go to Homepage
            </CustomButton>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <PasswordInput
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground -mt-2">
              Password must be at least 6 characters long
            </p>

            <PasswordInput
              label="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <CustomButton type="submit" className="w-full" disabled={loading}>
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </CustomButton>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Back to Homepage
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md bg-card rounded-2xl p-8 shadow-lg">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
