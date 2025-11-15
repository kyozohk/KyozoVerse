
"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';
import { ArrowLeft, ArrowRight, Palette, Image as ImageIcon, PlusCircle } from 'lucide-react';
import { CustomFormDialog, CustomButton, Dropzone, Switch } from '@/components/ui';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import Image from 'next/image';
import { Community } from '@/lib/types';
import { uploadFile } from '@/lib/upload-helper';

const STEPS = [
    { id: 1, title: 'Basic Info' },
    { id: 2, title: 'Customization' },
]

interface CreateCommunityDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    existingCommunity?: Community | null;
    onCommunityUpdated?: () => void;
}


export function CreateCommunityDialog({ isOpen, setIsOpen, existingCommunity, onCommunityUpdated }: CreateCommunityDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(0);
    const profileImageInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name: '',
        tagline: '',
        lore: '',
        mantras: '',
        communityPrivacy: 'public',
    });
    
    // States for images
    const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
    const [backgroundImageFile, setBackgroundImageFile] = useState<File | null>(null);
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
    const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
    
    const [selectedColor, setSelectedColor] = useState('#843484');

    const [isSubmitting, setIsSubmitting] = useState(false);
    
    useEffect(() => {
        if (existingCommunity) {
            setFormData({
                name: existingCommunity.name || '',
                tagline: existingCommunity.tagline || '',
                lore: (existingCommunity as any).lore || '',
                mantras: (existingCommunity as any).mantras || '',
                communityPrivacy: (existingCommunity as any).communityPrivacy || 'public',
            });
            setProfileImageUrl(existingCommunity.communityProfileImage || null);
            setBackgroundImageUrl(existingCommunity.communityBackgroundImage || null);
        } else {
            // Reset form when creating a new community
            setFormData({ name: '', tagline: '', lore: '', mantras: '', communityPrivacy: 'public' });
            setProfileImageFile(null);
            setBackgroundImageFile(null);
            setProfileImageUrl(null);
            setBackgroundImageUrl(null);
        }
    }, [existingCommunity, isOpen]);

    const colors = ['#843484', '#06C4B5', '#E1B327', '#CF7770', '#699FE5'];
    const profileImageOptions = ['/images/Parallax1.jpg', '/images/Parallax2.jpg', '/images/Parallax3.jpg', '/images/Parallax4.jpg'];

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
    
    const handleValueChange = (name: keyof typeof formData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = async () => {
        if (existingCommunity) {
            await handleUpdateCommunity();
        } else {
            await handleCreateCommunity();
        }
    }
    
    const handleFileUpload = async (file: File | null, communityId: string, type: 'profile' | 'background') => {
        if (!file) return null;
        
        try {
            const result = await uploadFile(file, communityId);
            return typeof result === 'string' ? result : result.url;
        } catch (error) {
            console.error(`Error uploading ${type} image:`, error);
            toast({
                title: 'Upload Failed',
                description: `Could not upload the ${type} image.`,
                variant: 'destructive',
            });
            return null;
        }
    };

    const handleUpdateCommunity = async () => {
        if (!user || !existingCommunity) return;
        setIsSubmitting(true);
        
        try {
            let updatedProfileImageUrl = profileImageUrl;
            if (profileImageFile) {
                updatedProfileImageUrl = await handleFileUpload(profileImageFile, existingCommunity.communityId, 'profile');
            }
            
            let updatedBackgroundImageUrl = backgroundImageUrl;
            if (backgroundImageFile) {
                updatedBackgroundImageUrl = await handleFileUpload(backgroundImageFile, existingCommunity.communityId, 'background');
            }

            const communityRef = doc(db, 'communities', existingCommunity.communityId);
            await updateDoc(communityRef, {
                ...formData,
                handle: formData.name.toLowerCase().replace(/\s+/g, '-'),
                communityProfileImage: updatedProfileImageUrl,
                communityBackgroundImage: updatedBackgroundImageUrl,
                updatedAt: serverTimestamp(),
            });

            toast({ title: 'Success', description: 'Community updated successfully.' });
            setIsOpen(false);
            onCommunityUpdated?.(); // Callback to refresh community data
        } catch (error) {
            console.error('Error updating community:', error);
            toast({ title: 'Error', description: 'Failed to update community.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    }

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
            ...formData,
            handle: formData.name.toLowerCase().replace(/\s+/g, '-'),
            ownerId: user.uid,
            createdAt: serverTimestamp(),
        };

        try {
            const docRef = await addDoc(collection(db, 'communities'), communityData);
            
            let finalProfileImageUrl = null;
            if (profileImageFile) {
                finalProfileImageUrl = await handleFileUpload(profileImageFile, docRef.id, 'profile');
            } else if(profileImageUrl) {
                finalProfileImageUrl = profileImageUrl; // Use pre-selected URL
            }
            
            let finalBackgroundImageUrl = null;
            if (backgroundImageFile) {
                finalBackgroundImageUrl = await handleFileUpload(backgroundImageFile, docRef.id, 'background');
            }
            
            // Update doc with image URLs
            await updateDoc(docRef, {
                communityProfileImage: finalProfileImageUrl,
                communityBackgroundImage: finalBackgroundImageUrl
            });

            toast({
                title: "Success",
                description: "Community created successfully.",
            });
            setIsOpen(false);
            setCurrentStep(0);
        } catch (error) {
            console.error("Error creating community: ", error);
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
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBrowseClick = () => {
        profileImageInputRef.current?.click();
    };

    const handleProfileImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfileImageFile(file);
            setProfileImageUrl(URL.createObjectURL(file)); // Show preview
        }
    };
    
    const handlePresetImageClick = (src: string) => {
        setProfileImageUrl(src);
        setProfileImageFile(null); // Clear any uploaded file
    };
    
    const progress = ((currentStep + 1) / STEPS.length) * 100;

    return (
        <CustomFormDialog
            open={isOpen} 
            onClose={() => setIsOpen(false)}
            title={existingCommunity ? 'Edit Community' : 'Create a New Community'}
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
                            <div className="flex items-center space-x-2 pt-2">
                                <Switch id="privacy-toggle" checked={formData.communityPrivacy === 'private'} onCheckedChange={(checked) => handleValueChange('communityPrivacy', checked ? 'private' : 'public')} />
                                <label htmlFor="privacy-toggle" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
                                    Private Community
                                </label>
                            </div>
                        </div>
                    )}
                    {currentStep === 1 && (
                         <div className="space-y-6">
                            <div>
                                <label className="text-sm text-muted-foreground mb-1 block">Background Image</label>
                                <Dropzone file={backgroundImageFile} onFileChange={setBackgroundImageFile} fileType="image" existingImageUrl={backgroundImageUrl} />
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground mb-1 block">Profile Image</label>
                                <div className="flex items-center gap-4">
                                    {profileImageOptions.map(src => (
                                        <Image key={src} src={src} alt="profile option" width={48} height={48} 
                                        className={`rounded-full border-2 cursor-pointer hover:border-primary ${profileImageUrl === src ? 'border-primary' : 'border-transparent'}`} 
                                        onClick={() => handlePresetImageClick(src)}
                                        />
                                    ))}
                                    <div onClick={handleBrowseClick} className="w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary">
                                        {profileImageFile || (profileImageUrl && !profileImageOptions.includes(profileImageUrl)) ? (
                                            <Image src={profileImageUrl!} alt="profile preview" width={48} height={48} className="rounded-full object-cover" />
                                        ) : (
                                            <PlusCircle className="h-6 w-6 text-muted-foreground" />
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        ref={profileImageInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleProfileImageFileChange}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground mb-1 block">Color Palette</label>
                                <div className="flex items-center gap-4">
                                    {colors.map(color => (
                                        <div key={color} style={{ backgroundColor: color }} className={`w-10 h-10 rounded-lg border-2 cursor-pointer hover:border-white ${selectedColor === color ? 'border-white ring-2 ring-primary' : 'border-transparent'}`} onClick={() => setSelectedColor(color)}></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                 <div className="mt-auto pt-6 grid grid-cols-2 gap-4">
                    {currentStep > 0 ? (
                        <CustomButton variant="outline" onClick={handlePrev} className="w-full h-10">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Previous
                        </CustomButton>
                    ) : (
                        <CustomButton variant="outline" onClick={() => setIsOpen(false)} className="w-full h-10">Cancel</CustomButton>
                    )}
                    
                    {currentStep < STEPS.length - 1 ? (
                        <CustomButton onClick={handleNext} className="w-full h-10">
                            Next
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </CustomButton>
                    ) : (
                        <CustomButton onClick={handleFormSubmit} disabled={isSubmitting} className="w-full h-10">
                            {isSubmitting ? 'Saving...' : 'Finish'}
                        </CustomButton>
                    )}
                </div>
            </div>
        </CustomFormDialog>
    );
}
