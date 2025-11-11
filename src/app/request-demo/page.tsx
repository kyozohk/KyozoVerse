"use client";

import React, { useState } from 'react';
import { RequestAccessDialog } from '@/components/auth/request-access-dialog';
import { CustomButton } from '@/components/ui/CustomButton';

export default function RequestDemoPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  return (
    <div className="container mx-auto py-16 px-4">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-3xl font-bold mb-6">Request Access Demo</h1>
        <p className="mb-8">Click the button below to open the request access dialog.</p>
        
        <CustomButton 
          variant="waitlist" 
          size="large"
          onClick={() => setDialogOpen(true)}
        >
          Request Access
        </CustomButton>
        
        <RequestAccessDialog 
          open={dialogOpen} 
          onOpenChange={setDialogOpen} 
        />
      </div>
    </div>
  );
}
