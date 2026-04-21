'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import CommunitySidebar from '@/components/layout/community-sidebar';
import { PageLoadingSkeleton } from '@/components/community/page-loading-skeleton';

export default function CommunityLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { handle: string };
}) {
  const pathname = usePathname();
  // Invite-join flow (`/[handle]/join`) is a PUBLIC signup screen. Skip the
  // community sidebar chrome so unauthenticated invitees see a clean form.
  const isJoinPath = /^\/[^/]+\/join(\/.*)?$/.test(pathname);

  if (isJoinPath) {
    return <div className="min-h-full">{children}</div>;
  }

  return (
    <div className="min-h-full">
      <CommunitySidebar />
      {/* CommunitySidebar is fixed at left-20 (80px) with w-64 (256px), so content needs 256px margin */}
      <main className="min-h-full" style={{ marginLeft: '256px' }}>
        <Suspense fallback={<PageLoadingSkeleton showMemberList={true} />}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
