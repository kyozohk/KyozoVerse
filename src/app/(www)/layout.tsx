
'use client';

import React, { useState } from 'react';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { getFirebase } from '@/firebase';
import { Toaster } from "@/components/ui/toaster";
import Image from 'next/image';
import Link from 'next/link';
import { CommunityAuthProviderWrapper } from '@/components/auth/community-auth-provider';
import { CustomButton, CustomFormDialog, Input, PasswordInput } from '@/components/ui';
import { FirebaseError } from 'firebase/app';
import { ResetPasswordDialog } from '@/components/auth/reset-password-dialog';
import { useCommunityAuth } from '@/hooks/use-community-auth';
import { THEME_COLORS } from '@/lib/theme-colors';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { user: communityUser, signIn: communitySignIn, signOut: communitySignOut } = useCommunityAuth();

  const handleSignIn = async () => {
    setError(null);
    try {
      await communitySignIn(email, password);
      setIsSignInOpen(false);
      // Stay on the public feed page after sign in
    } catch (error: any) {
        let description = "An unexpected error occurred. Please try again.";
        if (error instanceof FirebaseError) {
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                description = "Invalid credentials. Please check your email and password and try again.";
            }
        }
        setError(description);
    }
  };

  const handleSignOut = async () => {
    await communitySignOut();
  };

  const openSignIn = () => {
    setIsResetPasswordOpen(false);
    setIsSignInOpen(true);
  };

  const openResetPassword = () => {
    setIsSignInOpen(false);
    setIsResetPasswordOpen(true);
  };

  return (
    <FirebaseClientProvider firebase={getFirebase()}>
      <CommunityAuthProviderWrapper>
        <div 
          className="min-h-screen flex flex-col" 
        >
          {/* Main content */}
          <main className="flex-grow">
            {children}
          </main>       
        </div>
        <Toaster />

        <CustomFormDialog 
          open={isSignInOpen} 
          onClose={() => setIsSignInOpen(false)}
          title="Welcome Back"
          description="Sign in to access your Kyozo dashboard and community."
          backgroundImage="/bg/light_app_bg.png"
          videoSrc="/videos/form-right.mp4"
          color={THEME_COLORS.overview.primary}
        >
          <div className="flex flex-col h-full">
            <div className="flex-grow">
              <div className="space-y-6">
                <Input 
                  label="Email" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div>
                  <PasswordInput 
                    label="Password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {error && (
                    <p className="text-red-500 text-sm mt-2">
                      {error} <button type="button" className="text-primary hover:underline" onClick={openResetPassword}>Forgot password?</button>
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <div className="mb-4">
                <CustomButton 
                  onClick={handleSignIn} 
                  className="w-full py-3 text-base font-medium" 
                  variant="waitlist"
                >
                  Sign In
                </CustomButton>
              </div>
              <div className="text-center text-sm">
                Don't have an account? <button type="button" className="text-primary hover:underline" onClick={() => {
                  setIsSignInOpen(false);
                  // Add waitlist functionality here
                }}>Join the waitlist</button>
              </div>
            </div>
          </div>
        </CustomFormDialog>

        <ResetPasswordDialog
          open={isResetPasswordOpen}
          onClose={() => setIsResetPasswordOpen(false)}
          onGoBack={openSignIn}
        />
      </CommunityAuthProviderWrapper>
    </FirebaseClientProvider>
  );
}
