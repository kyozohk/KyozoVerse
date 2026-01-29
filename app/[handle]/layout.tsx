import React, { Suspense } from 'react';
import CommunitySidebar from '@/components/layout/community-sidebar';
import { PageLoadingSkeleton } from '@/components/community/page-loading-skeleton';

export default function CommunityLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { handle: string };
}) {
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
