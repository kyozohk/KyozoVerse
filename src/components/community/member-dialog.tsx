"use client";

import React, { useState, useEffect } from "react";
import { CustomFormDialog, Input, CustomButton, Label, Avatar, AvatarFallback, AvatarImage } from "@/components/ui";
import type { CommunityMember } from "@/lib/types";

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
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [phone, setPhone] = useState("");
  const [backgroundImage, setBackgroundImage] = useState<string>("/bg/light_app_bg.png");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialMember) {
        setDisplayName(initialMember.userDetails?.displayName || "");
        setEmail(initialMember.userDetails?.email || "");
        setPhone((initialMember as any).userDetails?.phone || "");
        setCountryCode("");
      } else {
        setDisplayName("");
        setEmail("");
        setCountryCode("");
        setPhone("");
      }
      setBackgroundImage("/bg/light_app_bg.png");
      setError(null);
      setSubmitting(false);
    }
  }, [open, mode, initialMember]);

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
      const combinedPhone = `${countryCode.trim()} ${phone.trim()}`.trim();
      await onSubmit({ displayName: displayName.trim(), email: email.trim(), phone: combinedPhone || undefined });
      onClose();
    } catch (e: any) {
      setError(e?.message || "Unable to save member. Please try again.");
      setSubmitting(false);
    }
  };

  const title = mode === "add" ? "Add member" : "Edit member";
  const description =
    mode === "add"
      ? communityName
        ? `Invite a new member to ${communityName}.`
        : "Add new member to your community."
      : "Update member's details.";

  const parallaxOptions = [
    { id: "p1", label: "Parallax 1", src: "/Parallax1.jpg" },
    { id: "p2", label: "Parallax 2", src: "/Parallax2.jpg" },
    { id: "p3", label: "Parallax 3", src: "/Parallax3.jpg" },
  ];

  const handleCustomImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setBackgroundImage(url);
  };

  return (
    <CustomFormDialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      backgroundImage={backgroundImage}
      // color="#31C6C0"
    >
      <div className="flex flex-col h-full gap-6 pt-2">
        <div className="flex items-center gap-3 mb-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={initialMember?.userDetails?.avatarUrl} />
            <AvatarFallback>
              {(displayName || initialMember?.userDetails?.displayName || "U").charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="text-left text-sm text-muted-foreground">
            {mode === "add" ? "Create a new member profile" : "Update this member's details"}
          </div>
        </div>

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
          <div className="grid grid-cols-[minmax(90px,120px)_1fr] gap-3">
            <Input
              label="Country code"
              value={countryCode}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCountryCode(e.target.value)}
            />
            <Input
              label="Phone"
              value={phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2 pt-2">
            <Label className="text-sm font-medium">Member icon</Label>
            <div className="flex flex-wrap gap-2">
              {parallaxOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`h-9 px-3 rounded-full border text-xs flex items-center justify-center ${
                    backgroundImage === option.src ? "bg-primary text-primary-foreground" : "bg-background/80"
                  }`}
                  onClick={() => setBackgroundImage(option.src)}
                >
                  {option.label}
                </button>
              ))}
              <label className="h-9 px-3 rounded-full border text-xs flex items-center justify-center cursor-pointer bg-background/80">
                Browse…
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCustomImageChange}
                />
              </label>
            </div>
          </div>
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        </div>
        <div className="mt-auto flex flex-row justify-end gap-3 pt-4">
          <CustomButton
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="flex-1"
          >
            Cancel
          </CustomButton>
          <CustomButton
            onClick={handleSubmit}
            className="flex-1"
            variant="waitlist"
            disabled={submitting}
          >
            {submitting ? (mode === "add" ? "Adding..." : "Saving...") : mode === "add" ? "Add member" : "Save changes"}
          </CustomButton>
        </div>
      </div>
    </CustomFormDialog>
  );
}
