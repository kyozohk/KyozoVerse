
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/icons/logo";
import { useToast } from "@/hooks/use-toast";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firestore";

export default function RequestAccessPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const docRef = doc(db, "accessRequests", email);
      await setDoc(docRef, {
        email: email,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Request Submitted",
        description: "Your request to join has been submitted. We will review it and send you an invitation link soon.",
      });
      
      router.push('/');
    } catch (error: any) {
      console.error("Request Access Error:", error);
      toast({
        title: "Error",
        description: "Failed to submit your request. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-sm mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Request to Join</CardTitle>
          <CardDescription>
            Enter your email to request access to our platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRequestAccess}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">
                Request Access
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
