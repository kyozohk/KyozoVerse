"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { CustomFormDialog, Input, Textarea, CustomButton } from '@/components/ui';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// New Components
import { ImageUploader } from './image-uploader';
import { LogoPicker } from './logo-picker';
import { ColorPalettePicker } from './color-palette-picker';
import { TagInput } from './tag-input';
import { PhoneNumberInput } from './phone-number-input';


export function CreateCommunityDialog({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (open: boolean) => void }) {
    const { user } = useAuth();
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        name: '',
        handle: '',
        tagline: '',
        lore: '',
        mantras: '',
        tags: [] as string[],
        phone: '',
        communityPrivacy: 'public',
        colorPalette: ['#A4D4D1', '#A4B8D4', '#D4A4B8', '#D4C2A4', '#B8D4A4'],
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bannerImage, setBannerImage] = useState<File | null>(null);
    const [logoImage, setLogoImage] = useState<File | null>(null);

    const handleValueChange = (name: keyof typeof formData, value: any) => {
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
        
        // Mocking upload for now, in a real app these would upload to a service
        const bannerUrl = bannerImage ? URL.createObjectURL(bannerImage) : '';
        const logoUrl = logoImage ? URL.createObjectURL(logoImage) : '';

        const communityData = {
            ...formData,
            bannerUrl,
            logoUrl,
            ownerId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        try {
            await addDoc(collection(db, 'communities'), communityData);
            toast({
                title: "Success",
                description: "Community created successfully.",
            });
            setIsOpen(false);
        } catch (error) {
            console.error("Error creating community: ", error);
            toast({
                title: "Error",
                description: "Could not create community.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <CustomFormDialog
            open={isOpen}
            onClose={() => setIsOpen(false)}
            title="Create a New Community"
            description="Build a new space for your audience to connect."
            showVideo={true}
        >
            <div className="space-y-4 overflow-y-auto pr-4 h-full">
                <ImageUploader onFileChange={setBannerImage} />

                <LogoPicker onFileChange={setLogoImage} />
                
                <Input label="Community Name" value={formData.name} onChange={(e) => handleValueChange('name', e.target.value)} />
                <Input label="Handle" value={formData.handle} onChange={(e) => handleValueChange('handle', e.target.value)} />
                <Textarea label="Tagline" value={formData.tagline} onChange={(e) => handleValueChange('tagline', e.target.value)} rows={2} />
                <Textarea label="Lore" value={formData.lore} onChange={(e) => handleValueChange('lore', e.target.value)} rows={2} />
                <Textarea label="Mantras" value={formData.mantras} onChange={(e) => handleValueChange('mantras', e.target.value)} rows={2} />
                
                <PhoneNumberInput value={formData.phone} onChange={(value) => handleValueChange('phone', value)} />

                <ColorPalettePicker palette={formData.colorPalette} onPaletteChange={(palette) => handleValueChange('colorPalette', palette)} />
                
                <TagInput tags={formData.tags} setTags={(tags) => handleValueChange('tags', tags)} />

                <div className="flex items-center justify-between">
                    <Label>Community Privacy</Label>
                    <div className="flex items-center gap-2">
                        <Label>Private</Label>
                        <Switch
                            checked={formData.communityPrivacy === 'public'}
                            onCheckedChange={(checked) => handleValueChange('communityPrivacy', checked ? 'public' : 'private')}
                        />
                        <Label>Public</Label>
                    </div>
                </div>
            </div>
            <div className="pt-6 flex justify-end gap-4 border-t mt-4">
                <CustomButton variant="outline" onClick={() => setIsOpen(false)}>Cancel</CustomButton>
                <CustomButton onClick={handleCreateCommunity} disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Community'}
                </CustomButton>
            </div>
        </CustomFormDialog>
    );
}
