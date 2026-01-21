
import type {Metadata} from 'next';
import { Inter } from 'next/font/google'
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { getFirebase } from '@/firebase';
import ProLayoutClient from './pro-layout-client';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Kyozo Pro',
  description: 'Manage your communities on Kyozo.',
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body 
        className="font-body antialiased"
      >
        <FirebaseClientProvider firebase={getFirebase()}>
          <ProLayoutClient>
            {children}
          </ProLayoutClient>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
