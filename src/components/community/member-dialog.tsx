

"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/firebase/firestore";

interface MemberDialogProps {
  open: boolean;
  mode: "add" | "edit";
  communityName?: string;
  initialMember?: CommunityMember | null;
  onClose: () => void;
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
  onClose,
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

  const resetForm = () => {
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
  };

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
}, [open, mode, initialMember]);

  const handleClose = () => {
    onClose();
    // Delay reset to allow dialog to close gracefully
    setTimeout(resetForm, 300);
  };

  const handleFileUpload = async (file: File | null, type: 'avatar' | 'cover') => {
    if (!file) {
      console.log(`No ${type} file to upload`);
      return null;
    }
    
    if (!initialMember?.userId) {
      console.error('No userId found for file upload');
      toast({
        title: 'Upload Failed',
        description: 'User ID is missing. Cannot upload image.',
        variant: 'destructive',
      });
      return null;
    }
    
    console.log(`Uploading ${type} for user ${initialMember.userId}`);
    
    try {
        const result = await uploadFile(file, `user-media/${initialMember.userId}/${type}`);
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

  const handleSubmit = async () => {
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
          finalAvatarUrl = await handleFileUpload(avatarFile, 'avatar');
        }

        if (coverFile) {
          console.log('Uploading cover file...');
          finalCoverUrl = await handleFileUpload(coverFile, 'cover');
        }
      } else if (mode === 'add') {
        console.log('New member - using preset URLs only');
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
      handleClose();
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
  };
  
  const handleConfirmAddExistingUser = async () => {
      if (!existingUser || !communityName) return;

      setSubmitting(true);
      try {
        const communityRef = doc(db, "communities", communityName);
        const communityData = (await getDoc(communityRef)).data();
        await joinCommunity(existingUser.userId, communityData?.communityId, {
            displayName: existingUser.displayName,
            email: existingUser.email,
        });

        await updateDoc(doc(db, "communities", communityData?.communityId), {
          memberCount: increment(1)
        });

        toast({
          title: "Member Added",
          description: `${existingUser.displayName} has been added to the community.`,
        });
        handleClose();
      } catch (e: any) {
        setError(e.message || "Failed to add existing member.");
      } finally {
        setSubmitting(false);
      }
  };


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
      onClose={handleClose}
      title={existingUser ? 'User Found' : title}
      description={description}
      backgroundImage="/bg/light_app_bg.png"
      color={THEME_COLORS.members.primary}
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
                     <CustomButton variant="primary" onClick={handleConfirmAddExistingUser} disabled={submitting}>
                         {submitting ? 'Adding...' : 'Add to Community'}
                     </CustomButton>
                 </div>
             </div>
        ) : (
            <div className="flex-grow space-y-4">
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
              
              <div className="my-2">
                <Dropzone 
                  label="Profile Banner"
                  file={coverFile} 
                  onFileChange={setCoverFile}
                  fileType="image"
                  existingImageUrl={coverUrl}
                  className="h-24"
                />
              </div>
              
              {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            </div>
        )}
        {!existingUser && (
          <div className="mt-8 flex flex-row justify-end gap-3 pt-4">
            <CustomButton
              variant="outline"
              onClick={handleClose}
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
        )}
      </div>
    </CustomFormDialog>
  );
}
