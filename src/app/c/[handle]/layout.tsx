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
        className="min-h-screen flex flex-col dark" 
        style={{
          backgroundImage: `url('/bg/light_app_bg.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          backgroundColor: '#121212'
        }}
      >
        {/* Global header for all public pages */}
        <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
          <div className="container mx-auto py-3 px-4 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="KyozoVerse" width={120} height={35} />
              <span className="text-sm font-medium text-primary hidden sm:inline">Public View</span>
            </Link>
            <Link 
              href="/" 
              className="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-medium transition-colors"
            >
              Sign In
            </Link>
          </div>
        </header>
        
        {/* Main content */}
        <main className="flex-grow">
          {children}
        </main>
        
        {/* Global footer for all public pages */}
        <footer className="bg-white/80 backdrop-blur-sm border-t py-6">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <Image src="/favicon.png" alt="KyozoVerse" width={24} height={24} />
                <p className="text-sm text-gray-500">
                  © {new Date().getFullYear()} KyozoVerse. All rights reserved.
                </p>
              </div>
              <div className="flex gap-6">
                <Link href="/" className="text-sm text-gray-500 hover:text-primary">
                  Terms
                </Link>
                <Link href="/" className="text-sm text-gray-500 hover:text-primary">
                  Privacy
                </Link>
                <Link href="/" className="text-sm text-gray-500 hover:text-primary">
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
      <Toaster />
    </FirebaseClientProvider>
  );
}
