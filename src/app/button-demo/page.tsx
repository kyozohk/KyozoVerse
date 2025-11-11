"use client";

import React from 'react';
import { CustomButton } from '@/components/ui/CustomButton';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

export default function ButtonDemoPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Waitlist Button Demo</h1>
      
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Waitlist Button</h2>
        <div className="flex flex-col items-center gap-8 mb-8">
          <CustomButton variant="waitlist" size="large">
            Join the waitlist
          </CustomButton>
          
          <div className="w-full max-w-md">
            <Input 
              label="Email" 
              placeholder="Enter your email" 
              required 
            />
          </div>
          
          <div className="w-full max-w-md">
            <Checkbox 
              label="I agree to receive updates about KyozoVerse" 
              checked={true}
              onCheckedChange={() => {}}
            />
          </div>
        </div>
      </section>
      
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Other Button Variants</h2>
        <div className="flex flex-wrap gap-4 mb-4">
          <CustomButton>Default Button</CustomButton>
          <CustomButton variant="primary">Primary Button</CustomButton>
          <CustomButton variant="outline">Outline Button</CustomButton>
        </div>
      </section>
    </div>
  );
}
