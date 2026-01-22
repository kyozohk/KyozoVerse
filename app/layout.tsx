
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { getFirebase } from '@/firebase';

export const metadata: Metadata = {
  title: 'Kyozo Pro',
  description: 'Manage your communities on Kyozo.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body 
        className="antialiased"
        style={{ fontFamily: "'PT Sans', sans-serif" }}
      >
        <FirebaseClientProvider firebase={getFirebase()}>
            {children}
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
