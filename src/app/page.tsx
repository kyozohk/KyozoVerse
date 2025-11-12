"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CustomButton } from '@/components/ui/CustomButton';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { RequestAccessForm } from '@/components/auth/request-access-form';
import { ResetPasswordDialog } from '@/components/auth/reset-password-dialog';
import { useAuth } from '@/hooks/use-auth';
import { FirebaseError } from 'firebase/app';
import { Hero } from '@/components/landing/hero';

export default function Home() {
  const router = useRouter();
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [formType, setFormType] = useState('waitlist');
  const { user, signIn, signOut } = useAuth();

  const openWaitlist = () => {
    setIsSignInOpen(false);
    setIsResetPasswordOpen(false);
    setFormType('waitlist');
    setIsWaitlistOpen(true);
  };

  const openSignIn = () => {
    setIsWaitlistOpen(false);
    setIsResetPasswordOpen(false);
    setIsSignInOpen(true);
  };

  const openResetPassword = () => {
    setIsSignInOpen(false);
    setIsWaitlistOpen(false);
    setIsResetPasswordOpen(true);
  };

  const handleSignIn = async () => {
    setError(null);
    try {
      await signIn(email, password);
      setIsSignInOpen(false);
      router.push('/dashboard');
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

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <header className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center">
        <Image src="/favionc.png" alt="Kyozo Logo" width={100} height={28} />
        {user ? (
          <CustomButton onClick={signOut}>Sign Out</CustomButton>
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

      <Dialog 
        open={isWaitlistOpen} 
        onClose={() => setIsWaitlistOpen(false)}
        title={formType === 'signup' ? 'Welcome to Kyozo' : 'Join the Waitlist'}
        description={formType === 'signup' ? 'Create an account to access your community dashboard and settings.' : 'Join the exclusive club of creators, fill up the form and we will get back to you.'}
      >
        <RequestAccessForm 
          onCancel={() => setIsWaitlistOpen(false)} 
          onSignInClick={openSignIn} 
          formType={formType}
          setFormType={setFormType}
        />
      </Dialog>
      
      <Dialog 
        open={isSignInOpen} 
        onClose={() => setIsSignInOpen(false)}
        title="Welcome Back"
        description="Sign in to access your Kyozo dashboard and community."
        backgroundImage="/bg/light_app_bg.png"
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
                    {error} <a href="#" className="text-primary hover:underline" onClick={openResetPassword}>Forgot password?</a>
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
              Don't have an account? <button type="button" className="text-primary hover:underline" onClick={openWaitlist}>Join the waitlist</button>
            </div>
          </div>
        </div>
      </Dialog>

      <ResetPasswordDialog
        open={isResetPasswordOpen}
        onClose={() => setIsResetPasswordOpen(false)}
        onGoBack={openSignIn}
      />
    </div>
  );
}
