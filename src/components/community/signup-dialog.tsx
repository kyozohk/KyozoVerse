'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input, PasswordInput, PhoneInput, Button, Checkbox } from '@/components/ui';
import { X } from 'lucide-react';
import Image from 'next/image';

interface SignupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isSignup: boolean;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  agreedToPrivacy: boolean;
  error: string | null;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onAgreedToPrivacyChange: (value: boolean) => void;
  onSubmit: () => void;
  onGoogleSignIn: () => void;
  onToggleMode: () => void;
  onShowPrivacyPolicy: () => void;
  communityName?: string;
}

export const SignupDialog: React.FC<SignupDialogProps> = ({
  isOpen,
  onClose,
  isSignup,
  firstName,
  lastName,
  email,
  phone,
  password,
  agreedToPrivacy,
  error,
  onFirstNameChange,
  onLastNameChange,
  onEmailChange,
  onPhoneChange,
  onPasswordChange,
  onAgreedToPrivacyChange,
  onSubmit,
  onGoogleSignIn,
  onToggleMode,
  onShowPrivacyPolicy,
  communityName = 'Community'
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/bg/light_app_bg.png"
            alt="Background"
            fill
            className="object-cover"
          />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="relative z-10 p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold text-center" style={{ color: '#843484' }}>
              {isSignup ? 'Join' : 'Sign In to'} {communityName}
            </DialogTitle>
            <p className="text-sm text-gray-600 text-center mt-2">
              {isSignup 
                ? 'Create your account to access exclusive content' 
                : 'Welcome back! Sign in to continue'}
            </p>
          </DialogHeader>

          <div className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Name Fields (Signup only) */}
            {isSignup && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  type="text"
                  value={firstName}
                  onChange={(e) => onFirstNameChange(e.target.value)}
                  placeholder="John"
                  required
                />
                <Input
                  label="Last Name"
                  type="text"
                  value={lastName}
                  onChange={(e) => onLastNameChange(e.target.value)}
                  placeholder="Doe"
                  required
                />
              </div>
            )}

            {/* Phone (Signup only) */}
            {isSignup && (
              <PhoneInput
                label="Phone Number"
                value={phone}
                onChange={(value) => onPhoneChange(value)}
                placeholder="+1234567890"
                required
              />
            )}

            {/* Email */}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="john@example.com"
              required
            />

            {/* Password */}
            <PasswordInput
              label="Password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="Enter your password"
              required
            />

            {/* Privacy Policy (Signup only) */}
            {isSignup && (
              <div className="flex items-start gap-2">
                <Checkbox
                  checked={agreedToPrivacy}
                  onCheckedChange={(checked) => onAgreedToPrivacyChange(checked as boolean)}
                />
                <label className="text-sm text-gray-600">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={onShowPrivacyPolicy}
                    className="text-[#843484] hover:underline"
                  >
                    Privacy Policy
                  </button>
                </label>
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={onSubmit}
              className="w-full"
              style={{ backgroundColor: '#843484' }}
            >
              {isSignup ? 'Sign Up' : 'Sign In'}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Google Sign In */}
            <Button
              onClick={onGoogleSignIn}
              variant="outline"
              className="w-full"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>

            {/* Toggle Mode */}
            <div className="text-center text-sm text-gray-600">
              {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={onToggleMode}
                className="text-[#843484] hover:underline font-medium"
              >
                {isSignup ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
