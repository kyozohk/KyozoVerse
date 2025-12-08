
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
          style={{
            backgroundImage: `url('/bg/feed_bg.jpeg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            backgroundColor: '#0f172a'
          }}
        >
          {/* Global header for all public pages */}
          <header className=" backdrop-blur-sm shadow-sm sticky top-0 z-10">
            <div className="container mx-auto py-3 px-40 flex justify-between items-center">
              <Link href="#" onClick={(e) => e.preventDefault()} className="flex items-center gap-2">
                <Image src="/logo.png" alt="KyozoVerse" width={120} height={35} className="brightness-150" />
              </Link>
              {communityUser ? (
                 <CustomButton
                    onClick={handleSignOut}
                    className="text-sm text-white/70 hover:text-white bg-primary/80 hover:bg-primary/90 px-4 py-2 rounded-full font-medium transition-colors"
                >
                    Sign Out
                </CustomButton>
              ) : (
                <CustomButton
                    onClick={openSignIn} 
                    className="text-sm text-white/70 hover:text-white bg-primary/80 hover:bg-primary/90 px-4 py-2 rounded-full font-medium transition-colors"
                >
                    Sign In
                </CustomButton>
              )}
            </div>
          </header>
          
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
