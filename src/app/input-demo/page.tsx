"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { CustomButton } from '@/components/ui/CustomButton';

export default function InputDemoPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Floating Label Inputs Demo</h1>
      
      <div className="max-w-md mx-auto space-y-6">
        <div>
          <Input 
            label="Email Address" 
            type="email" 
            placeholder="Enter your email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div>
          <Input 
            label="Full Name" 
            placeholder="Enter your name" 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        
        <div>
          <Input 
            label="Password" 
            type="password" 
            placeholder="Enter your password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <div>
          <Input 
            label="With Error" 
            placeholder="Try typing here" 
            error="This field has an error"
          />
        </div>
        
        <div>
          <Input 
            label="Disabled Input" 
            placeholder="You can't edit this" 
            disabled
          />
        </div>
        
        <div className="pt-4">
          <CustomButton variant="waitlist" size="large" className="w-full">
            Submit Form
          </CustomButton>
        </div>
      </div>
    </div>
  );
}
