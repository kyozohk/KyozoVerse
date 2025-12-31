
'use client';

import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface RemoveTagDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tagName: string;
}

export function RemoveTagDialog({ isOpen, onClose, onConfirm, tagName }: RemoveTagDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Tag</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove the tag "<strong>{tagName}</strong>" from this member?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-500 hover:bg-red-600">
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
