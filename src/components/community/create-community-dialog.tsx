
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
import { Progress } from '../ui/progress';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const STEPS = [
    { id: 1, title: 'Basic Info' },
    { id: 2, title: 'Details' },
    { id: 3, title: 'Privacy' },
]

export function CreateCommunityDialog({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (open: boolean) => void }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(0);

    const [formData, setFormData] = useState({
        name: '',
        handle: '',
        tagline: '',
        lore: '',
        mantras: '',
        communityPrivacy: 'public',
        communityType: 'community',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };
    
    const handleValueChange = (name: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateCommunity = async () => {
        if (!user || !formData.name.trim() || !formData.handle.trim()) {
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
                name: formData.name,
                handle: formData.handle,
                slug: formData.handle,
                tagline: formData.tagline,
                lore: formData.lore,
                mantras: formData.mantras,
                communityPrivacy: formData.communityPrivacy,
                communityType: formData.communityType,
                ownerId: user.uid,
                createdBy: user.uid,
                updatedBy: user.uid,
                memberCount: 1,
                status: 'draft',
                visibility: true,
                isDeleted: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            await addDoc(collection(db, 'communities'), communityData);

            toast({
                title: "Success",
                description: "Community created successfully.",
            });
            setIsOpen(false);
            setCurrentStep(0);
            setFormData({
                name: '',
                handle: '',
                tagline: '',
                lore: '',
                mantras: '',
                communityPrivacy: 'public',
                communityType: 'community',
            });
        } catch (error) {
            console.error("Error creating community: ", error);
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: '/communities',
                operation: 'create',
                requestResourceData: { name: formData.name, handle: formData.handle, ownerId: user.uid },
            }));
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const progress = ((currentStep + 1) / STEPS.length) * 100;

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogContent className="sm:max-w-lg">
                <AlertDialogHeader>
                    <AlertDialogTitle>Create a New Community</AlertDialogTitle>
                    <AlertDialogDescription>
                        Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].title}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <Progress value={progress} className="w-full" />

                <div className="space-y-4 py-4 min-h-[250px]">
                    {currentStep === 0 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Community Name *</Label>
                                <Input id="name" value={formData.name} onChange={(e) => handleValueChange('name', e.target.value)} placeholder="e.g. AI Innovators" label="Community Name *" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="handle">Community Handle *</Label>
                                <Input id="handle" value={formData.handle} onChange={(e) => handleValueChange('handle', e.target.value)} placeholder="ai-innovators" label="Community Handle *"/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tagline">Tagline</Label>
                                <Input id="tagline" value={formData.tagline} onChange={(e) => handleValueChange('tagline', e.target.value)} placeholder="A short, catchy phrase for your community" label="Tagline" />
                            </div>
                        </div>
                    )}
                    {currentStep === 1 && (
                         <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="lore">Lore</Label>
                                <Textarea id="lore" value={formData.lore} onChange={(e) => handleValueChange('lore', e.target.value)} placeholder="The story and background of your community." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mantras">Mantras</Label>
                                <Textarea id="mantras" value={formData.mantras} onChange={(e) => handleValueChange('mantras', e.target.value)} placeholder="Core beliefs or slogans of your community." />
                            </div>
                        </div>
                    )}
                    {currentStep === 2 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="communityPrivacy">Privacy</Label>
                                <Select value={formData.communityPrivacy} onValueChange={(value) => handleValueChange('communityPrivacy', value)}>
                                    <SelectTrigger id="communityPrivacy">
                                        <SelectValue placeholder="Select privacy level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="public">Public</SelectItem>
                                        <SelectItem value="private">Private</SelectItem>
                                        <SelectItem value="invite-only">Invite Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="communityType">Type</Label>
                                <Select value={formData.communityType} onValueChange={(value) => handleValueChange('communityType', value)}>
                                    <SelectTrigger id="communityType">
                                        <SelectValue placeholder="Select community type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="community">Community</SelectItem>
                                        <SelectItem value="group">Group</SelectItem>
                                        <SelectItem value="event">Event</SelectItem>
                                        <SelectItem value="course">Course</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </div>
                <AlertDialogFooter className="flex justify-between w-full">
                    <div>
                        {currentStep > 0 && (
                            <Button variant="outline" onClick={handlePrev}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Previous
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <AlertDialogCancel asChild>
                          <Button variant="ghost">Cancel</Button>
                        </AlertDialogCancel>
                        {currentStep < STEPS.length - 1 && (
                            <Button onClick={handleNext}>
                                Next
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        )}
                        {currentStep === STEPS.length - 1 && (
                            <Button onClick={handleCreateCommunity} disabled={isSubmitting}>
                                {isSubmitting ? 'Creating...' : 'Create Community'}
                            </Button>
                        )}
                    </div>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
