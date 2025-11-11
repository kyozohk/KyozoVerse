
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { CustomButton } from '@/components/ui/CustomButton';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { RequestAccessForm } from '@/components/auth/request-access-form';

export default function Home() {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  
  const openWaitlist = () => {
    setIsSignInOpen(false);
    setIsWaitlistOpen(true);
  };
  
  const openSignIn = () => {
    setIsWaitlistOpen(false);
    setIsSignInOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <header className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center">
        <Image src="/logo.png" alt="Kyozo Logo" width={100} height={28} />
        <button className="text-foreground">
          <svg
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-6xl md:text-8xl font-bold tracking-tight font-serif" style={{lineHeight: 1.2}}>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-blue-400 to-green-500">
            Discover your
            <br />
            creative universe
          </span>
        </h1>

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
        title="Welcome to Kyozo"
        description="Create an account or sign in to access your community dashboard and settings."
      >
        <RequestAccessForm 
          onCancel={() => setIsWaitlistOpen(false)} 
          onSignInClick={openSignIn} 
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
              />
              <Input 
                label="Password" 
                type="password" 
              />
            </div>
          </div>
          
          <div className="mt-6">
            <div className="mb-4">
              <button className="w-full button">Sign In</button>
            </div>
            
            <div className="text-center text-sm text-secondary">
              Don't have an account? <button type="button" className="text-primary hover:underline" onClick={openWaitlist}>Join the waitlist</button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
