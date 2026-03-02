'use client';

import { useState, useRef, useEffect } from 'react';
import { CustomFormDialog, CustomButton, Input } from '@/components/ui';
import { Loader2 } from 'lucide-react';

interface EmailVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  firstName: string;
  onVerified: () => void;
  onResend: () => Promise<void>;
}

export function EmailVerificationDialog({
  open,
  onOpenChange,
  email,
  firstName,
  onVerified,
  onResend,
}: EmailVerificationDialogProps) {
  const [code, setCode] = useState(['', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [open]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleInputChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError(null);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (value && index === 3 && newCode.every(d => d)) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pastedData.length === 4) {
      const newCode = pastedData.split('');
      setCode(newCode);
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (verificationCode: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Verification failed');
        setCode(['', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }

      onVerified();
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setCode(['', '', '', '']);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    setResending(true);
    setError(null);

    try {
      await onResend();
      setResendCooldown(60); // 60 second cooldown
      setCode(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <CustomFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Verify your email"
      description={`We've sent a 4-digit code to ${email}. Enter it below to verify your email.`}
    >
      <div className="flex flex-col items-center py-4">
        {/* Code input boxes */}
        <div className="flex gap-3 mb-6" onPaste={handlePaste}>
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={loading}
              className="w-14 h-16 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
            />
          ))}
        </div>

        {error && (
          <div className="text-sm text-red-500 mb-4 text-center">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Verifying...</span>
          </div>
        )}

        <div className="text-center text-sm text-muted-foreground">
          Didn't receive the code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || resendCooldown > 0}
            className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resending ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend'}
          </button>
        </div>
      </div>
    </CustomFormDialog>
  );
}
