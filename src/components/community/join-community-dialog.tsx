
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { JoinForm } from './join-form';

export const JoinCommunityDialog = ({ 
  open, 
  onOpenChange, 
  communityId, 
  communityName 
}: { 
  open: boolean, 
  onOpenChange: (open: boolean) => void,
  communityId: string,
  communityName: string
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <JoinForm 
          communityId={communityId} 
          communityName={communityName}
          onSuccess={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
