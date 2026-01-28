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
      {/* CommunitySidebar is fixed at left-20 (80px) with w-64 (256px), so content needs ml-64 (256px) */}
      <main className="flex-1 ml-64">
        {children}
      </main>
    </div>
  );
}
