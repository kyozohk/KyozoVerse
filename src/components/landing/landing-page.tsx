
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CustomButton, CustomFormDialog, Input, PasswordInput } from '@/components/ui';
import { RequestAccessDialog } from '@/components/auth/request-access-dialog';
import { ResetPasswordDialog } from '@/components/auth/reset-password-dialog';
import { useAuth } from '@/hooks/use-auth';
import { FirebaseError } from 'firebase/app';
import { Hero } from '@/components/landing/hero';

export function LandingPage() {
  const router = useRouter();
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const { user, signIn, signOut, signUp } = useAuth();

  useEffect(() => {
    // If the user is logged in, redirect them to the dashboard
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);


  const openWaitlist = () => {
    setIsSignInOpen(false);
    setIsSignUpOpen(false);
    setIsResetPasswordOpen(false);
    setIsWaitlistOpen(true);
  };

  const openSignIn = () => {
    setIsWaitlistOpen(false);
    setIsSignUpOpen(false);
    setIsResetPasswordOpen(false);
    setIsSignInOpen(true);
  };

  const openSignUp = () => {
    setIsWaitlistOpen(false);
    setIsSignInOpen(false);
    setIsResetPasswordOpen(false);
    setIsSignUpOpen(true);
  };

  const openResetPassword = () => {
    setIsSignInOpen(false);
    setIsSignUpOpen(false);
    setIsWaitlistOpen(false);
    setIsResetPasswordOpen(true);
  };

  const handleSignIn = async () => {
    setError(null);
    try {
      await signIn(email, password);
      setIsSignInOpen(false);
      // The auth provider will handle the redirect
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

  const handleSignUp = async () => {
    setSignUpError(null);
    try {
      if (!signUpName || !signUpEmail || !signUpPassword) {
        setSignUpError("Please fill in all fields.");
        return;
      }
      if (signUpPassword.length < 6) {
        setSignUpError("Password must be at least 6 characters.");
        return;
      }
      await signUp(signUpEmail, signUpPassword, { displayName: signUpName });
      setIsSignUpOpen(false);
      // The auth provider will handle the redirect
    } catch (error: any) {
        let description = "An unexpected error occurred. Please try again.";
        if (error instanceof FirebaseError) {
            if (error.code === 'auth/email-already-in-use') {
                description = "This email is already registered. Please sign in instead.";
            } else if (error.code === 'auth/invalid-email') {
                description = "Invalid email address.";
            } else if (error.code === 'auth/weak-password') {
                description = "Password is too weak. Please use a stronger password.";
            }
        }
        setSignUpError(description);
    }
  };
  
    // If the user is logged in, we render null while the useEffect redirects
    if (user) {
        return null;
    }

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <header className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center">
        <Image src="/logo.png" alt="Kyozo Logo" width={100} height={28} />
        {user ? (
          <CustomButton onClick={() => {
            signOut();
          }}>Sign Out</CustomButton>
        ) : (
          <CustomButton onClick={openSignIn}>Sign In</CustomButton>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <Hero />

        <div className="mt-12">
          <CustomButton
            onClick={openWaitlist}
          >
            Join the waitlist
          </CustomButton>
        </div>
      </main>

      <RequestAccessDialog
        open={isWaitlistOpen}
        onOpenChange={setIsWaitlistOpen}
      />
      
      <CustomFormDialog 
        open={isSignInOpen} 
        onClose={() => setIsSignInOpen(false)}
        title="Welcome Back"
        description="Sign in to access your Kyozo dashboard and community."
        backgroundImage="/bg/light_app_bg.png"
        color="#C170CF"
      >
        <div className="flex flex-col h-full">
          <div className="flex-grow">
            <div className="space-y-4">
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
          
          <div className="mt-6">
            <div className="mb-4">
              <CustomButton onClick={handleSignIn} className="w-full">Sign In</CustomButton>
            </div>

            <div className="text-center text-sm text-secondary mt-4">
              Want to create communities? <button type="button" className="text-primary hover:underline" onClick={openSignUp}>Sign Up</button>
            </div>
            <div className="text-center text-sm text-secondary mt-2">
              Just browsing? <button type="button" className="text-primary hover:underline" onClick={openWaitlist}>Join the waitlist</button>
            </div>
          </div>
        </div>
      </CustomFormDialog>

      <CustomFormDialog 
        open={isSignUpOpen} 
        onClose={() => setIsSignUpOpen(false)}
        title="Create Your Account"
        description="Sign up to create and manage your own communities on Kyozo."
        backgroundImage="/bg/light_app_bg.png"
        color="#C170CF"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="signup-name" className="block text-sm font-medium mb-2">Full Name</label>
              <Input
                id="signup-name"
                type="text"
                placeholder="Enter your full name"
                value={signUpName}
                onChange={(e) => setSignUpName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
              />
            </div>
            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium mb-2">Email</label>
              <Input
                id="signup-email"
                type="email"
                placeholder="Enter your email"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
              />
            </div>
            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium mb-2">Password</label>
              <PasswordInput
                id="signup-password"
                placeholder="Create a password (min 6 characters)"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
              />
            </div>
            {signUpError && (
              <div className="text-sm text-red-500 bg-red-50 p-3 rounded">
                {signUpError}
              </div>
            )}
          </div>
          
          <div className="mt-6">
            <div className="mb-4">
              <CustomButton onClick={handleSignUp} className="w-full">Create Account</CustomButton>
            </div>

            <div className="text-center text-sm text-secondary mt-4">
              Already have an account? <button type="button" className="text-primary hover:underline" onClick={openSignIn}>Sign In</button>
            </div>
            <div className="text-center text-sm text-secondary mt-2">
              Just browsing? <button type="button" className="text-primary hover:underline" onClick={openWaitlist}>Join the waitlist</button>
            </div>
          </div>
        </div>
      </CustomFormDialog>

      <ResetPasswordDialog
        open={isResetPasswordOpen}
        onClose={() => setIsResetPasswordOpen(false)}
        onGoBack={openSignIn}
      />
    </div>
  );
}
