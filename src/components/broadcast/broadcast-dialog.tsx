
'use client';

import React, { useState } from 'react';
import { CustomFormDialog } from '@/components/ui/dialog';

interface BroadcastDialogProps {
  isOpen: boolean;
  onClose: () => void;
  members: any[];
}

const BroadcastDialog: React.FC<BroadcastDialogProps> = ({ isOpen, onClose, members }) => {
  return (
    <CustomFormDialog
      open={isOpen}
      onClose={onClose}
      title="Create Broadcast"
      description={`You are about to send a message to ${members.length} members.`}
      backgroundImage="/bg/light_app_bg.png"
      color="#F59E0B" // Amber color for broadcast
    >
      <div className="p-6">
        <p>Broadcast form will go here.</p>
      </div>
    </CustomFormDialog>
  );
};

export default BroadcastDialog;
