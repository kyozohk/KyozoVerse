"use client";

import React, { useState } from 'react';
import { CustomButton } from '@/components/ui/CustomButton';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function WaitlistButtonDemo() {
  // Add state for dialog visibility
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  
  // Define the onSignInClick function
  const onSignInClick = () => {
    console.log('Sign In clicked');
    setIsWaitlistOpen(false);
    setIsSignInOpen(true);
  };
  
  // Define the onWaitlistClick function
  const onWaitlistClick = () => {
    console.log('Waitlist clicked');
    setIsSignInOpen(false);
    setIsWaitlistOpen(true);
  };

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-3xl font-bold mb-6">Waitlist Button Demo</h1>
        <p className="mb-8">Updated button with #763182 color</p>
        <div className="text-center text-sm text-secondary">
          Don't have an account? <button 
            type="button" 
            className="text-primary hover:underline" 
            onClick={onSignInClick}
          >
            Sign In here
          </button>
        </div>
        
        <div className="flex flex-col items-center gap-8 mt-6">
          <CustomButton 
            variant="waitlist"
            onClick={onWaitlistClick}
          >
            Join the waitlist
          </CustomButton>
        </div>
      </div>

      {/* Sign In Dialog */}
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
          </div>
        </div>
      </Dialog>

      {/* Waitlist Dialog */}
      <Dialog 
        open={isWaitlistOpen} 
        onClose={() => setIsWaitlistOpen(false)}
        title="Welcome to Kyozo"
        description="Create an account or sign in to access your community dashboard and settings."
      >
        <div className="flex flex-col h-full">
          <div className="flex-grow">
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" />
              <Input label="Last Name" />
            </div>
            <Input label="Phone" />
            <Input label="Email" />
          </div>
          
          <div className="mt-6">
            <div className="flex gap-4 mb-4">
              <button className="w-full button" onClick={() => setIsWaitlistOpen(false)}>Cancel</button>
              <button className="w-full button">Submit</button>
            </div>
            
            <div className="text-center text-sm text-secondary">
              Already have an account? <button 
                type="button" 
                className="text-primary hover:underline" 
                onClick={onSignInClick}
              >
                Sign In here
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
