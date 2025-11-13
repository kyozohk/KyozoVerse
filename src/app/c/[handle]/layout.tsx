'use client';

import { FirebaseClientProvider } from '@/firebase/client-provider';
import { getFirebase } from '@/firebase';
import { Toaster } from "@/components/ui/toaster";
import Image from 'next/image';
import Link from 'next/link';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseClientProvider firebase={getFirebase()}>
      <div 
        className="min-h-screen flex flex-col" 
        style={{
          backgroundImage: `url('/bg/feed_bg.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          backgroundColor: '#0f172a'
        }}
      >
        {/* Global header for all public pages */}
        <header className=" backdrop-blur-sm shadow-sm sticky top-0 z-10">
          <div className="container mx-auto py-3 px-4 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="KyozoVerse" width={120} height={35} className="brightness-150" />
            </Link>
            <Link 
              href="/" 
              className="text-sm text-white/70 hover:text-white bg-primary/80 hover:bg-primary/90 px-4 py-2 rounded-full font-medium transition-colors"
            >
              Sign In
            </Link>
          </div>
        </header>
        
        {/* Main content */}
        <main className="flex-grow">
          {children}
        </main>       
      </div>
      <Toaster />
    </FirebaseClientProvider>
  );
}
