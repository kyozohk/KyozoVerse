
"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';
import { ArrowLeft, ArrowRight, Palette, Image as ImageIcon, PlusCircle } from 'lucide-react';
import { CustomFormDialog, CustomButton, Dropzone, Switch } from '@/components/ui';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import Image from 'next/image';

const STEPS = [
    { id: 1, title: 'Basic Info' },
    { id: 2, title: 'Customization' },
]

export function CreateCommunityDialog({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (open: boolean) => void }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(0);

    const [formData, setFormData] = useState({
        name: '',
        tagline: '',
        lore: '',
        mantras: '',
        communityPrivacy: 'public',
    });
    
    const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
    const [backgroundImageFile, setBackgroundImageFile] = useState<File | null>(null);
    const [selectedColor, setSelectedColor] = useState('#843484');

    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const colors = ['#843484', '#06C4B5', '#E1B327', '#CF7770', '#699FE5'];

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep + 1);
        }
    };
    
    const handleValueChange = (name: keyof typeof formData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateCommunity = async () => {
        if (!user || !formData.name.trim()) {
            toast({
                title: "Error",
                description: "Please fill in the community name.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        
        const communityData = {
            name: formData.name,
            handle: formData.name.toLowerCase().replace(/\s+/g, '-'),
            tagline: formData.tagline,
            lore: formData.lore,
            mantras: formData.mantras,
            communityPrivacy: formData.communityPrivacy,
            ownerId: user.uid,
            createdAt: serverTimestamp(),
            // The rest will be uploaded separately
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
                // Reset form data if needed
            }
        });
    };
    
    const progress = ((currentStep + 1) / STEPS.length) * 100;

    return (
        <CustomFormDialog
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
                            <Input label="Community Name *" value={formData.name} onChange={(e) => handleValueChange('name', e.target.value)} />
                            <Textarea label="Tagline" value={formData.tagline} onChange={(e) => handleValueChange('tagline', e.target.value)} rows={2} />
                            <Textarea label="Lore" value={formData.lore} onChange={(e) => handleValueChange('lore', e.target.value)} rows={4} />
                            <Textarea label="Mantras" value={formData.mantras} onChange={(e) => handleValueChange('mantras', e.target.value)} rows={2} />
                            <div className="flex items-center space-x-2">
                                <Switch id="privacy-toggle" checked={formData.communityPrivacy === 'private'} onCheckedChange={(checked) => handleValueChange('communityPrivacy', checked ? 'private' : 'public')} />
                                <label htmlFor="privacy-toggle" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Private Community
                                </label>
                            </div>
                        </div>
                    )}
                    {currentStep === 1 && (
                         <div className="space-y-6">
                            <div>
                                <label className="text-sm text-muted-foreground mb-1 block">Background Image</label>
                                <Dropzone file={backgroundImageFile} onFileChange={setBackgroundImageFile} fileType="image" />
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground mb-1 block">Profile Image</label>
                                <div className="flex items-center gap-4">
                                    {['/images/Parallax1.jpg', '/images/Parallax2.jpg', '/images/Parallax3.jpg', '/images/Parallax4.jpg', '/images/Parallax5.jpg'].map(src => (
                                        <Image key={src} src={src} alt="profile option" width={48} height={48} className="rounded-full border-2 border-transparent hover:border-primary cursor-pointer" />
                                    ))}
                                    <div className="w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary">
                                        <PlusCircle className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground mb-1 block">Color Palette</label>
                                <div className="flex items-center gap-4">
                                    {colors.map(color => (
                                        <div key={color} style={{ backgroundColor: color }} className="w-10 h-10 rounded-lg border-2 border-transparent hover:border-white cursor-pointer" onClick={() => setSelectedColor(color)}></div>
                                    ))}
                                </div>
                            </div>
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
        </CustomFormDialog>
    );
}
