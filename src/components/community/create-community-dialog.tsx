
"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { CustomButton } from '../ui/CustomButton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
        tags: '',
        location: '',
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
        
        const communityData = {
            name: formData.name,
            handle: formData.handle,
            slug: formData.handle,
            tagline: formData.tagline,
            lore: formData.lore,
            mantras: formData.mantras,
            tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            location: formData.location,
            communityPrivacy: formData.communityPrivacy,
            communityType: formData.communityType,
            ownerId: user.uid,
            createdBy: user.uid,
            updatedBy: user.uid,
            memberCount: 1,
            status: 'draft',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        addDoc(collection(db, 'communities'), communityData)
        .catch(async (serverError) => {
            console.error("Error creating community: ", serverError);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: '/communities',
                operation: 'create',
                requestResourceData: communityData,
            }));
            toast({
              title: "Error",
              description: "Could not create community. You might not have the correct permissions.",
              variant: "destructive",
            });
        }).finally(() => {
            setIsSubmitting(false);
            if(!isSubmitting){
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
                    tags: '',
                    location: '',
                    communityPrivacy: 'public',
                    communityType: 'community',
                });
            }
        });
    };
    
    const progress = ((currentStep + 1) / STEPS.length) * 100;

    return (
        <Dialog 
            open={isOpen} 
            onClose={() => setIsOpen(false)}
            title="Create a New Community"
            description={`Step ${currentStep + 1} of ${STEPS.length}: ${STEPS[currentStep].title}`}
        >
            <div className="flex flex-col h-full">
                <div className="flex-grow space-y-4">
                    <Progress value={progress} className="w-full mb-8" />
                    
                    {currentStep === 0 && (
                        <div className="space-y-4">
                            <Input label="Community Name *" value={formData.name} onChange={(e) => handleValueChange('name', e.target.value)} placeholder="e.g. AI Innovators" />
                            <Input label="Community Handle *" value={formData.handle} onChange={(e) => handleValueChange('handle', e.target.value)} placeholder="ai-innovators" />
                            <Input label="Tagline" value={formData.tagline} onChange={(e) => handleValueChange('tagline', e.target.value)} placeholder="A short, catchy phrase for your community" />
                        </div>
                    )}
                    {currentStep === 1 && (
                         <div className="space-y-4">
                            <Textarea label="Community Lore" value={formData.lore} onChange={(e) => handleValueChange('lore', e.target.value)} placeholder="The story and background of your community." />
                            <Textarea label="Mantras" value={formData.mantras} onChange={(e) => handleValueChange('mantras', e.target.value)} placeholder="Core beliefs or slogans of your community." />
                            <Input label="Tags (comma-separated)" value={formData.tags} onChange={(e) => handleValueChange('tags', e.target.value)} placeholder="e.g. AI, Art, Music" />
                             <Input label="Location" value={formData.location} onChange={(e) => handleValueChange('location', e.target.value)} placeholder="e.g. Hong Kong" />
                        </div>
                    )}
                    {currentStep === 2 && (
                        <div className="space-y-4">
                             <Select value={formData.communityPrivacy} onValueChange={(value) => handleValueChange('communityPrivacy', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select privacy level" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="public">Public</SelectItem>
                                    <SelectItem value="private">Private</SelectItem>
                                    <SelectItem value="invite-only">Invite Only</SelectItem>
                                </SelectContent>
                            </Select>
                             <Select value={formData.communityType} onValueChange={(value) => handleValueChange('communityType', value)}>
                                <SelectTrigger>
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
                    )}
                </div>

                 <div className="mt-auto pt-6 grid grid-cols-2 gap-4">
                    {currentStep > 0 ? (
                        <CustomButton variant="outline" onClick={handlePrev} className="w-full">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Previous
                        </CustomButton>
                    ) : (
                        <CustomButton variant="outline" onClick={() => setIsOpen(false)} className="w-full">Cancel</CustomButton>
                    )}
                    
                    {currentStep < STEPS.length - 1 ? (
                        <CustomButton onClick={handleNext} className="w-full">
                            Next
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </CustomButton>
                    ) : (
                        <CustomButton onClick={handleCreateCommunity} disabled={isSubmitting} className="w-full">
                            {isSubmitting ? 'Creating...' : 'Create Community'}
                        </CustomButton>
                    )}
                </div>
            </div>
        </Dialog>
    );
}
