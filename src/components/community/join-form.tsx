
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firestore";
import { joinCommunity } from "@/lib/community-utils";
import { communityAuth } from "@/firebase/community-auth"; // Use community-specific auth

interface JoinFormProps {
  communityId: string;
  communityName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function JoinForm({ communityId, communityName, onSuccess, onCancel }: JoinFormProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phoneNumber: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create user account using the communityAuth instance
      const userCredential = await createUserWithEmailAndPassword(
        communityAuth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      // Set display name
      await updateProfile(user, {
        displayName: `${formData.firstName} ${formData.lastName}`
      });

      // Create user document in Firestore (can be shared)
      await setDoc(doc(db, "users", user.uid), {
        userId: user.uid,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        displayName: `${formData.firstName} ${formData.lastName}`,
        phoneNumber: formData.phoneNumber || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Join the community
      await joinCommunity(user.uid, communityId, {
        displayName: `${formData.firstName} ${formData.lastName}`,
        email: formData.email
      });

      toast({
        title: "Welcome!",
        description: `You've successfully joined ${communityName}!`,
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error joining community:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to join community. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <Card className="w-full max-w-md mx-auto border-none shadow-none bg-transparent pt-0 mt-0">
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Joining..." : "Join Community"}
            </Button>
          </CardFooter>
        </form>
      </Card>
  );
}
