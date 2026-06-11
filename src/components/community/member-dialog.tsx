

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
import { Plus, BookUser, QrCode } from "lucide-react";
import { QrContactScanner, type ScannedContact } from './qr-contact-scanner';
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

  // Contact Picker API — supported on Android Chrome/Edge; not on iOS, where
  // the autocomplete attributes below let Safari's AutoFill Contact fill the
  // form from the keyboard instead.
  const [contactPickerSupported, setContactPickerSupported] = useState(false);
  useEffect(() => {
    setContactPickerSupported(
      typeof navigator !== 'undefined' && 'contacts' in navigator && 'select' in (navigator as any).contacts
    );
  }, []);

  // QR contact scan — for meeting someone in person: they show their contact
  // QR (vCard/MECARD) and it fills the form. Works on iOS and Android.
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleScannedContact = useCallback((c: ScannedContact) => {
    setScannerOpen(false);
    if (c.firstName) setFirstName(c.firstName);
    if (c.lastName) setLastName(c.lastName);
    if (c.email) setEmail(c.email);
    if (c.phone) setPhone(c.phone);
  }, []);

  const handlePickContact = async () => {
    try {
      const contacts = await (navigator as any).contacts.select(
        ['name', 'email', 'tel'],
        { multiple: false }
      );
      const c = contacts?.[0];
      if (!c) return; // user cancelled
      const fullName: string = (c.name?.[0] || '').trim();
      if (fullName) {
        const [first, ...rest] = fullName.split(/\s+/);
        setFirstName(first);
        setLastName(rest.join(' '));
      }
      if (c.email?.[0]) setEmail(c.email[0]);
      if (c.tel?.[0]) setPhone(c.tel[0]);
    } catch {
      // Picker unavailable or dismissed — the manual form still works.
    }
  };

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, initialMember?.id]);

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
    } catch (error: any) {
        console.error(`[member-dialog][${type}] upload_failed`, JSON.stringify({
            userId,
            fileName: file?.name,
            message: error?.message,
        }));
        toast({
            title: 'Upload Failed',
            description: `Could not upload the ${type} image.${error?.message ? ` (${error.message})` : ''}`,
            variant: 'destructive',
        });
        // Apr 21 2026: re-throw so the caller can abort the save instead of
        // silently writing `null` over an existing avatar/cover URL.
        throw error;
    }
  };

  // Shared preflight for avatar/cover. Same 5MB ceiling as community banners
  // because the server route enforces the same limit and the platform rejects
  // anything larger at the edge.
  const PROFILE_IMAGE_LIMIT = 5 * 1024 * 1024;
  const checkImageSizes = (): string[] => {
    const oversize: string[] = [];
    if (avatarFile && avatarFile.size > PROFILE_IMAGE_LIMIT) {
      oversize.push(`avatar (${Math.round(avatarFile.size / 1024 / 1024)}MB)`);
    }
    if (coverFile && coverFile.size > PROFILE_IMAGE_LIMIT) {
      oversize.push(`cover (${Math.round(coverFile.size / 1024 / 1024)}MB)`);
    }
    return oversize;
  };
  
  const handleConfirmAddExistingUser = useCallback(async () => {
      if (!existingUser || !communityName) return;

      // Apr 21 2026: preflight 5MB image check BEFORE touching Firestore so
      // we never half-join a user and then fail on the avatar upload.
      const oversize = checkImageSizes();
      if (oversize.length) {
        toast({
          title: 'Image too large',
          description: `Please pick images under 5MB. Too large: ${oversize.join(', ')}.`,
          variant: 'destructive',
        });
        return;
      }

      setSubmitting(true);

      // Upload images FIRST. If either fails, don't add the user to the
      // community at all.
      let finalAvatarUrl = avatarUrl;
      let finalCoverUrl = coverUrl;
      try {
        if (avatarFile) {
          console.log('Uploading new avatar for existing user...');
          finalAvatarUrl = await handleFileUpload(avatarFile, existingUser.userId, 'avatar');
        }
        if (coverFile) {
          console.log('Uploading new cover for existing user...');
          finalCoverUrl = await handleFileUpload(coverFile, existingUser.userId, 'cover');
        }
      } catch (uploadError) {
        console.error('[member-dialog] existing-user image upload failed - NOT joining community', uploadError);
        setSubmitting(false);
        return;
      }

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
    
    // KYPRO-14 / KYPRO-39: validate all required fields + email format BEFORE
    // submitting so the error is raised synchronously and rendered at the top
    // of the form (see moved error panel below).
    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last names are required.");
      return;
    }
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    // KYPRO-14: reject "notanemail"-style inputs that previously sailed through.
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_RE.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);

    // Apr 21 2026: preflight 5MB image check BEFORE any Firestore writes.
    const oversize = checkImageSizes();
    if (oversize.length) {
      toast({
        title: 'Image too large',
        description: `Please pick images under 5MB. Too large: ${oversize.join(', ')}.`,
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    // Upload images FIRST. If any upload fails, we don't call onSubmit at all,
    // preventing a half-saved member profile.
    let finalAvatarUrl = avatarUrl;
    let finalCoverUrl = coverUrl;
    try {
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
    } catch (uploadError) {
      console.error('[member-dialog] image upload failed - NOT saving member', uploadError);
      setSubmitting(false);
      return;
    }

    try {
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
      onOpenChange(false);
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
  }, [existingUser, firstName, lastName, email, phone, mode, initialMember, avatarFile, coverFile, avatarUrl, coverUrl, onSubmit, handleConfirmAddExistingUser, onOpenChange, toast]);


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
                {/* KYPRO-13 / KYPRO-39: render the validation error at the TOP of the
                    form so it is always visible within the modal viewport. Previously
                    it lived below the Profile Banner uploader (below the fold). */}
                {error && (
                  <div
                    role="alert"
                    className="px-3 py-2 rounded-md text-sm"
                    style={{ backgroundColor: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}
                  >
                    {error}
                  </div>
                )}
                {/* KYPRO-39: required fields get an asterisk so users know what's mandatory
                    before attempting submission. */}
                {mode === 'add' && (
                  <div className="flex gap-2">
                    {contactPickerSupported && (
                      <button
                        type="button"
                        onClick={handlePickContact}
                        className="flex-1 flex items-center justify-center gap-2 h-11 rounded-lg border border-dashed text-sm font-semibold transition-colors hover:bg-[#FAF5EC]"
                        style={{ borderColor: '#E07B39', color: '#E07B39' }}
                      >
                        <BookUser className="h-4 w-4" />
                        From contacts
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setScannerOpen(true)}
                      className="flex-1 flex items-center justify-center gap-2 h-11 rounded-lg border border-dashed text-sm font-semibold transition-colors hover:bg-[#FAF5EC]"
                      style={{ borderColor: '#E07B39', color: '#E07B39' }}
                    >
                      <QrCode className="h-4 w-4" />
                      Scan contact QR
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="First Name *"
                        name="given-name"
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
                    />
                    <Input
                        label="Last Name *"
                        name="family-name"
                        autoComplete="family-name"
                        value={lastName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
                    />
                </div>
              <Input
                label="Email *"
                type="email"
                name="email"
                autoComplete="email"
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
              <div className="inputWrapper my-2 relative">
                <div
                  className="flex items-center gap-3 p-4 rounded-lg border border-dotted overflow-x-auto no-scrollbar"
                  style={{ borderWidth: '1px', borderColor: '#E8DFD1' }}
                >
                  {DEFAULT_BANNERS.map((banner) => (
                    <div
                      key={banner.id}
                      className="relative w-20 h-12 flex-shrink-0 rounded-lg cursor-pointer transition-all overflow-hidden"
                      onClick={() => {
                        setCoverUrl(banner.url);
                        setCoverFile(null);
                      }}
                    >
                      <Image
                        src={banner.url}
                        alt={banner.label}
                        fill
                        className="object-cover"
                      />
                      {coverUrl === banner.url && !coverFile && (
                        <div
                          className="absolute inset-0 rounded-lg border-[3px]"
                          style={{ borderColor: '#E07B39' }}
                        />
                      )}
                    </div>
                  ))}
                  
                  {/* Custom Upload Button */}
                  <div
                    className="relative w-20 h-12 flex-shrink-0 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer"
                    style={{ borderColor: '#E07B39', color: '#E07B39' }}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e: any) => {
                        const file = e.target?.files?.[0];
                        if (file) {
                          setCoverFile(file);
                          setCoverUrl(null);
                        }
                      };
                      input.click();
                    }}
                  >
                    {coverFile || (coverUrl && !DEFAULT_BANNERS.some(b => b.url === coverUrl)) ? (
                      <>
                        {coverFile && (
                          <Image
                            src={URL.createObjectURL(coverFile)}
                            alt="Custom banner"
                            fill
                            className="object-cover rounded-lg"
                          />
                        )}
                        {!coverFile && coverUrl && (
                          <Image
                            src={coverUrl}
                            alt="Custom banner"
                            fill
                            className="object-cover rounded-lg"
                          />
                        )}
                        <div
                          className="absolute inset-0 rounded-lg border-2"
                          style={{ borderColor: '#E07B39' }}
                        />
                      </>
                    ) : (
                      <Plus className="h-6 w-6" />
                    )}
                  </div>
                </div>
                <label
                  className="floatingLabel"
                  style={{
                    top: '-0.7rem',
                    fontSize: '0.75rem',
                    backgroundColor: '#F5F0E8',
                    color: '#E07B39',
                  }}
                >
                  Profile Banner
                </label>
              </div>
              
              {/* KYPRO-13: the old bottom-of-form error was below the fold; the top
                  error panel above is the single source of truth now. */}
            </div>
            <div className="flex-shrink-0 mt-auto pt-4 sm:pt-6 flex flex-row justify-end gap-3 border-t sm:border-t-0" style={{ borderColor: '#E8DFD1' }}>
                <CustomButton
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
                className="w-full"
                style={{ borderColor: '#E8DFD1', color: '#5B4A3A' }}
                >
                Cancel
                </CustomButton>
                <CustomButton
                onClick={handleSubmit}
                className="w-full"
                disabled={submitting}
                style={{ backgroundColor: '#E8DFD1', color: '#5B4A3A', border: 'none' }}
                >
                {submitting ? (mode === "add" ? "Adding..." : "Saving...") : (mode === "add" ? "Add Member" : "Save Changes")}
                </CustomButton>
            </div>
          </div>
        )}
      </div>
      <QrContactScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScannedContact}
      />
    </CustomFormDialog>
  );
}
