import React from 'react';
import MainSidebar from '@/components/layout/main-sidebar';
import CommunitySidebar from '@/components/v2/community-sidebar';

export default function CommunityLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { handle: string };
}) {
  return (
    <div className="flex h-screen">
      <MainSidebar />
      <CommunitySidebar handle={params.handle} />
      <main className="flex-1 ml-20">
        {children}
      </main>
    </div>
  );
}
