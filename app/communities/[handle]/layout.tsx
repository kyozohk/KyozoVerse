import React from 'react';
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
      <CommunitySidebar handle={params.handle} />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
