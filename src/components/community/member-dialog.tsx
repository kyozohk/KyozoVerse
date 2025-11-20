
"use client";

import React, { useState, useEffect, useRef } from "react";
import { CustomFormDialog, Input, CustomButton, Label, Dropzone } from "@/components/ui";
import type { CommunityMember } from "@/lib/types";
import { ProfileImageSelector } from './profile-image-selector';
import { uploadFile } from "@/lib/upload-helper";
import { useToast } from "@/hooks/use-toast";
import { PhoneInput } from "../ui/phone-input";

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
  const [displayName, setDisplayName] = useState("");
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
        setDisplayName(initialMember.userDetails?.displayName || "");
        setEmail(initialMember.userDetails?.email || "");
        setPhone(initialMember.userDetails?.phone || "");
        setAvatarUrl(initialMember.userDetails?.avatarUrl || null);
        setCoverUrl(initialMember.userDetails?.coverUrl || null);
      } else {
        setDisplayName("");
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
    if (!file || !initialMember?.userId) return null;
    
    try {
        const result = await uploadFile(file, `user-media/${initialMember.userId}/${type}`);
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

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      setError("Name is required");
      return;
    }
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {

      let finalAvatarUrl = avatarUrl;
      if (avatarFile) {
        finalAvatarUrl = await handleFileUpload(avatarFile, 'avatar');
      }

      let finalCoverUrl = coverUrl;
      if (coverFile) {
        finalCoverUrl = await handleFileUpload(coverFile, 'cover');
      }

      await onSubmit({ 
        displayName: displayName.trim(), 
        email: email.trim(), 
        phone: phone.trim() || undefined,
        avatarUrl: finalAvatarUrl || undefined,
        coverUrl: finalCoverUrl || undefined
      });
      onClose();
    } catch (e: any) {
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
      color="#843484" // Default Purple
    >
      <div className="flex flex-col h-full gap-2">
        <div className="space-y-4">
          <Input
            label="Name"
            value={displayName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
          />
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
          
          <div className="inputWrapper">
             <div className="inputContainer pt-4">
                 <ProfileImageSelector
                    selectedImage={avatarUrl}
                    onSelectImage={setAvatarUrl}
                    onSelectFile={setAvatarFile}
                />
                <label className="floatingLabel" style={{top: '-0.7rem', fontSize: '0.75rem', backgroundColor: '#EDEDED', color: '#C170CF'}}>Profile Icon</label>
             </div>
          </div>
          
          <Dropzone 
            label="Profile Banner"
            file={coverFile} 
            onFileChange={setCoverFile}
            fileType="image"
            existingImageUrl={coverUrl}
          />
          
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
