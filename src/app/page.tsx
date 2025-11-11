
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { CustomButton } from '@/components/ui/CustomButton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RequestAccessForm } from '@/components/auth/request-access-form';

export default function Home() {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <header className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center">
        <Image src="/logo.png" alt="Kyozo Logo" width={100} height={28} />
        <button className="text-foreground">
          <svg
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-6xl md:text-8xl font-bold tracking-tight font-serif" style={{lineHeight: 1.2}}>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-blue-400 to-green-500">
            Discover your
            <br />
            creative universe
          </span>
        </h1>

        <div className="mt-12">
          <CustomButton
            onClick={() => setIsWaitlistOpen(true)}
          >
            Join the waitlist
          </CustomButton>
        </div>
      </main>

      <Dialog open={isWaitlistOpen} onOpenChange={setIsWaitlistOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Request to Join</DialogTitle>
            <DialogDescription>
              Enter your email to request access to our platform.
            </DialogDescription>
          </DialogHeader>
          <RequestAccessForm />
        </DialogContent>
      </Dialog>
    </div>
  );
}
