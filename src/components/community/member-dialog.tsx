
"use client";

import React, { useState, useEffect, useRef } from "react";
import { CustomFormDialog, Input, CustomButton, Label, Dropzone } from "@/components/ui";
import type { CommunityMember } from "@/lib/types";
import { ProfileImageSelector } from './profile-image-selector';
import { uploadFile } from "@/lib/upload-helper";
import { useToast } from "@/hooks/use-toast";
import { PhoneInput } from "../ui/phone-input";
import { THEME_COLORS } from "@/lib/theme-colors";

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

  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialMember) {
        const nameParts = initialMember.userDetails?.displayName?.split(' ') || [''];
        setFirstName(nameParts[0] || "");
        setLastName(nameParts.slice(1).join(' ') || "");
        setEmail(initialMember.userDetails?.email || "");
        setPhone(initialMember.userDetails?.phone || "");
        setAvatarUrl(initialMember.userDetails?.avatarUrl || null);
        setCoverUrl(initialMember.userDetails?.coverUrl || null);
      } else {
        setFirstName("");
        setLastName("");
        setEmail("");
        setPhone("");
        setAvatarUrl(null);
        setCoverUrl(null);
      }
      setAvatarFile(null);
      setCoverFile(null);
      setError(null);
      setSubmitting(false);
    }
  }, [open, mode, initialMember]);

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

      // Only upload files when editing existing members (not when adding new ones)
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
        // For new members, just use the selected preset URLs (no file upload)
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
      onClose();
    } catch (e: any) {
      console.error('Error in handleSubmit:', e);
      setError(e?.message || "Unable to save member. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const title = mode === "add" ? "Add member" : "Edit member";
  const description =
    mode === "add"
      ? communityName
        ? `Invite a new member to ${communityName}.`
        : "Add new member to your community."
      : "";

  return (
    <CustomFormDialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      backgroundImage="/bg/light_app_bg.png"
      videoSrc="/videos/form-right.mp4"
      showVideo={true}
      color={THEME_COLORS.members.primary}
    >
      <div className="flex flex-col h-full gap-2">
        <div className="space-y-4">
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
        <div className="mt-auto flex flex-row justify-end gap-3 pt-4">
          <CustomButton
            variant="outline"
            onClick={onClose}
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
    </CustomFormDialog>
  );
}
