import React from 'react';
import MainSidebar from '@/components/layout/main-sidebar';

export default function CommunitiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <MainSidebar />
      <main className="flex-1 ml-20">
        {children}
      </main>
    </div>
  );
}
