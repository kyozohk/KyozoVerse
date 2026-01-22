import React from 'react';
import CommunitySidebar from '@/components/layout/community-sidebar';

export default function CommunityLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { handle: string };
}) {
  return (
    <div className="flex h-full">
      <CommunitySidebar />
      <main className="flex-1" style={{ marginLeft: '260px' }}>
        {children}
      </main>
    </div>
  );
}
