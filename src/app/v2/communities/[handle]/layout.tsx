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
    <div className="flex h-full w-full">
      <CommunitySidebar handle={params.handle} />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
