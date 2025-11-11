import React from 'react';
import MainSidebar from '@/components/layout/main-sidebar';
import CommunitySidebar from '@/components/layout/community-sidebar';
import Header from '@/components/layout/header';
import { AuthProvider } from '@/components/auth/auth-provider';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        <MainSidebar />
        <CommunitySidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto bg-secondary p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
