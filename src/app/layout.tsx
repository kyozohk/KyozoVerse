import type {Metadata} from 'next';
import { Inter } from 'next/font/google'
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { getFirebase } from '@/firebase';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'KyozoVerse',
  description: 'The universe of communities.',
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
        style={{
          backgroundImage: `url('/bg/light_app_bg.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <FirebaseClientProvider firebase={getFirebase()}>
          {children}
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
