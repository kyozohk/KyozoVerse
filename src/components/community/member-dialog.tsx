

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { CustomFormDialog, Input, CustomButton, Label, Dropzone } from '@/components/ui';
import type { CommunityMember, User } from "@/lib/types";
import { ProfileImageSelector } from './profile-image-selector';
import { uploadFile } from "@/lib/upload-helper";
import { useToast } from "@/hooks/use-toast";
import { PhoneInput } from "../ui/phone-input";
import { THEME_COLORS } from "@/lib/theme-colors";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { joinCommunity } from "@/lib/community-utils";
import { doc, updateDoc, increment, getDocs, collection, query, where } from "firebase/firestore";
import { db } from "@/firebase/firestore";
import Image from "next/image";
import { Check } from "lucide-react";

// Default banner options
const DEFAULT_BANNERS = [
  { id: 'banner1', url: '/banner1.png', label: 'Banner 1' },
  { id: 'banner2', url: '/banner2.png', label: 'Banner 2' },
  { id: 'banner3', url: '/banner3.png', label: 'Banner 3' },
];

interface MemberDialogProps {
  open: boolean;
  mode: "add" | "edit";
  communityName?: string;
  initialMember?: CommunityMember | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    displayName: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
    coverUrl?: string;
  }) => Promise<void> | void;
}

export function MemberDialog({
  open,
  mode,
  communityName,
  initialMember,
  onOpenChange,
  onSubmit,
}: MemberDialogProps) {
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [existingUser, setExistingUser] = useState<User | null>(null);

  const resetForm = useCallback(() => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setAvatarUrl(null);
    setCoverUrl(null);
    setAvatarFile(null);
    setCoverFile(null);
    setError(null);
    setSubmitting(false);
    setExistingUser(null);
  }, []);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialMember) {
          const nameParts = initialMember.userDetails?.displayName?.split(' ') || [''];
          setFirstName(nameParts[0] || "");
          setLastName(nameParts.slice(1).join(' ') || "");
          setEmail(initialMember.userDetails?.email || "");
          setPhone(initialMember.userDetails?.phone || "");
          setAvatarUrl(initialMember.userDetails?.avatarUrl || null);
          setCoverUrl(initialMember.userDetails?.coverUrl || null);
          setAvatarFile(null);
          setCoverFile(null);
      } else {
          resetForm();
      }
    }
  }, [open, mode, initialMember, resetForm]);

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => resetForm(), 300); // Reset after closing animation
      return () => clearTimeout(timer);
    }
  }, [open, resetForm]);

  const handleFileUpload = async (file: File | null, userId: string | null | undefined, type: 'avatar' | 'cover') => {
    if (!file) {
      console.log(`No ${type} file to upload`);
      return null;
    }
    
    if (!userId) {
      console.error('No userId found for file upload');
      toast({
        title: 'Upload Failed',
        description: 'User ID is missing. Cannot upload image.',
        variant: 'destructive',
      });
      return null;
    }
    
    console.log(`Uploading ${type} for user ${userId}`);
    
    try {
        const result = await uploadFile(file, `user-media/${userId}/${type}`);
        const url = typeof result === 'string' ? result : result.url;
        console.log(`${type} uploaded successfully:`, url);
        return url;
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
  
  const handleConfirmAddExistingUser = useCallback(async () => {
      if (!existingUser || !communityName) return;

      setSubmitting(true);
      try {
        const communitiesRef = collection(db, "communities");
        const q = query(communitiesRef, where("name", "==", communityName));
        const communitySnap = await getDocs(q);
        if (communitySnap.empty) {
          throw new Error('Community not found');
        }
        const communityId = communitySnap.docs[0].id;
        
        await joinCommunity(existingUser.userId, communityId, {
            displayName: existingUser.displayName,
            email: existingUser.email,
        });

        await updateDoc(doc(db, "communities", communityId), {
          memberCount: increment(1)
        });
        
        let finalAvatarUrl = avatarUrl;
        let finalCoverUrl = coverUrl;

        if (avatarFile) {
          console.log('Uploading new avatar for existing user...');
          finalAvatarUrl = await handleFileUpload(avatarFile, existingUser.userId, 'avatar');
        }
        if (coverFile) {
          console.log('Uploading new cover for existing user...');
          finalCoverUrl = await handleFileUpload(coverFile, existingUser.userId, 'cover');
        }

        // Update user profile if new images were provided
        if ((finalAvatarUrl && finalAvatarUrl !== existingUser.avatarUrl) || (finalCoverUrl && finalCoverUrl !== existingUser.coverUrl)) {
            const userRef = doc(db, 'users', existingUser.userId);
            const updates: {avatarUrl?: string, coverUrl?: string} = {};
            if (finalAvatarUrl) updates.avatarUrl = finalAvatarUrl;
            if (finalCoverUrl) updates.coverUrl = finalCoverUrl;
            await updateDoc(userRef, updates);
        }

        toast({
          title: "Member Added",
          description: `${existingUser.displayName} has been added to the community.`,
        });
        onOpenChange(false);
      } catch (e: any) {
        setError(e.message || "Failed to add existing member.");
      } finally {
        setSubmitting(false);
      }
  }, [existingUser, communityName, toast, onOpenChange, avatarFile, coverFile, avatarUrl, coverUrl]);

  const handleSubmit = useCallback(async () => {
    if (existingUser) {
        handleConfirmAddExistingUser();
        return;
    }
    
    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last names are required");
      return;
    }
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      console.log('Starting member save...', {
        mode,
        avatarFile: !!avatarFile,
        coverFile: !!coverFile,
        currentAvatarUrl: avatarUrl,
        currentCoverUrl: coverUrl
      });

      let finalAvatarUrl = avatarUrl;
      let finalCoverUrl = coverUrl;

      if (mode === 'edit' && initialMember?.userId) {
        if (avatarFile) {
          console.log('Uploading avatar file...');
          finalAvatarUrl = await handleFileUpload(avatarFile, initialMember.userId, 'avatar');
        }

        if (coverFile) {
          console.log('Uploading cover file...');
          finalCoverUrl = await handleFileUpload(coverFile, initialMember.userId, 'cover');
        }
      } else if (mode === 'add') {
        // For adding new user, avatarUrl is already set from ProfileImageSelector
        finalAvatarUrl = avatarUrl;
        console.log('New member - using preset/uploaded URLs');
      }

      console.log('Final URLs:', {
        avatarUrl: finalAvatarUrl,
        coverUrl: finalCoverUrl
      });

      await onSubmit({ 
        displayName: `${firstName.trim()} ${lastName.trim()}`, 
        email: email.trim(), 
        phone: phone.trim() || undefined,
        avatarUrl: finalAvatarUrl || undefined,
        coverUrl: finalCoverUrl || undefined
      });
      // The parent component is now responsible for closing the dialog
      // onOpenChange(false);
    } catch (e: any) {
      if (e.code === 'auth/user-already-exists' && e.existingUser) {
        setExistingUser(e.existingUser);
      } else {
        console.error('Error in handleSubmit:', e);
        setError(e?.message || "Unable to save member. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }, [existingUser, firstName, lastName, email, phone, mode, initialMember, avatarFile, coverFile, avatarUrl, coverUrl, onSubmit, handleConfirmAddExistingUser]);


  const title = mode === "add" ? "Add member" : "Edit member";
  const description =
    mode === "add" && !existingUser
      ? communityName
        ? `Invite a new member to ${communityName}.`
        : "Add new member to your community."
      : existingUser
        ? `This user already exists. Do you want to add them to the community?`
        : "";

  return (
    <CustomFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={existingUser ? 'User Found' : title}
      description={description}
    >
      <div className="flex flex-col h-full">
        {existingUser ? (
             <div className="flex flex-col h-full">
                 <div className="flex-grow space-y-4">
                     <p>A user with this email or phone number already exists.</p>
                     <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
                         <Avatar className="h-16 w-16">
                            <AvatarImage src={existingUser.avatarUrl} />
                            <AvatarFallback>{existingUser.displayName?.charAt(0) || 'U'}</AvatarFallback>
                         </Avatar>
                         <div>
                            <p className="font-semibold text-lg">{existingUser.displayName}</p>
                            <p className="text-muted-foreground">{existingUser.email}</p>
                         </div>
                     </div>
                     <p>Do you want to add this existing user to the community?</p>
                 </div>
                 <div className="mt-8 flex flex-row justify-end gap-3 pt-4">
                     <CustomButton variant="outline" onClick={() => setExistingUser(null)} disabled={submitting}>Back to form</CustomButton>
                     <CustomButton variant="default" onClick={handleConfirmAddExistingUser} disabled={submitting}>
                         {submitting ? 'Adding...' : 'Add to Community'}
                     </CustomButton>
                 </div>
             </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-grow space-y-4 overflow-y-auto pr-2 pb-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="First Name"
                        value={firstName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
                    />
                    <Input
                        label="Last Name"
                        value={lastName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
                    />
                </div>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              />
              <PhoneInput
                value={phone}
                onChange={setPhone}
              />

              <ProfileImageSelector
                selectedImage={avatarUrl}
                onSelectImage={setAvatarUrl}
                onSelectFile={setAvatarFile}
              />
              
              {/* Banner Selection */}
              <div className="my-2">
                <Label className="text-sm font-medium mb-2 block">Profile Banner</Label>
                
                {/* Default Banner Options */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {DEFAULT_BANNERS.map((banner) => (
                    <button
                      key={banner.id}
                      type="button"
                      onClick={() => {
                        setCoverUrl(banner.url);
                        setCoverFile(null);
                      }}
                      className={`relative h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        coverUrl === banner.url && !coverFile
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-muted hover:border-primary/50'
                      }`}
                    >
                      <Image
                        src={banner.url}
                        alt={banner.label}
                        fill
                        className="object-cover"
                      />
                      {coverUrl === banner.url && !coverFile && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="bg-primary rounded-full p-1">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Custom Upload */}
                <Dropzone 
                  label="Or upload custom banner"
                  file={coverFile} 
                  onFileChange={(file) => {
                    setCoverFile(file);
                    if (file) {
                      setCoverUrl(null); // Clear preset selection when uploading custom
                    }
                  }}
                  fileType="image"
                  existingImageUrl={coverFile ? undefined : (coverUrl && !DEFAULT_BANNERS.some(b => b.url === coverUrl) ? coverUrl : undefined)}
                  className="h-20"
                />
              </div>
              
              {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            </div>
            <div className="flex-shrink-0 mt-auto pt-6 flex flex-row justify-end gap-3">
                <CustomButton
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
                className="w-full"
                >
                Cancel
                </CustomButton>
                <CustomButton
                variant="outline"
                onClick={handleSubmit}
                className="w-full"
                disabled={submitting}
                >
                {submitting ? (mode === "add" ? "Adding..." : "Saving...") : "Save changes"}
                </CustomButton>
            </div>
          </div>
        )}
      </div>
    </CustomFormDialog>
  );
}
