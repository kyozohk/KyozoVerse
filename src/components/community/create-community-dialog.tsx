
"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Textarea } from '../ui/textarea';

export function CreateCommunityDialog({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (open: boolean) => void }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [handle, setHandle] = useState('');
    const [tagline, setTagline] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreateCommunity = async () => {
        if (!user || !name.trim() || !handle.trim()) {
            toast({
                title: "Error",
                description: "Please fill in all required fields.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const communityData = {
                name,
                handle,
                tagline,
                description,
                ownerId: user.uid,
                memberCount: 1,
                createdAt: serverTimestamp(),
            };
            await addDoc(collection(db, 'communities'), communityData);

            toast({
                title: "Success",
                description: "Community created successfully.",
            });
            setIsOpen(false);
            setName('');
            setHandle('');
            setTagline('');
            setDescription('');
        } catch (error) {
            console.error("Error creating community: ", error);
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: '/communities',
                operation: 'create',
                requestResourceData: { name, handle, ownerId: user.uid },
            }));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Create New Community</AlertDialogTitle>
                    <AlertDialogDescription>
                        Fill in the details below to create your new community.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Community Name *</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. AI Innovators" label="Community Name *" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="handle">Community Handle *</Label>
                        <Input id="handle" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="ai-innovators" label="Community Handle *"/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="tagline">Tagline</Label>
                        <Input id="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="A short, catchy phrase for your community" label="Tagline" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell us more about your community" />
                    </div>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel asChild>
                      <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    </AlertDialogCancel>
                    <Button onClick={handleCreateCommunity} disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create Community'}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
