"use client";

import React from 'react';
import { CustomButton } from '@/components/ui/CustomButton';

export default function WaitlistButtonDemo() {
  return (
    <div className="container mx-auto py-16 px-4">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-3xl font-bold mb-6">Waitlist Button Demo</h1>
        <p className="mb-8">Updated button with #763182 color</p>
        
        <div className="flex flex-col items-center gap-8">
          <CustomButton 
            variant="waitlist"
          >
            Join the waitlist
          </CustomButton>
        </div>
      </div>
    </div>
  );
}
