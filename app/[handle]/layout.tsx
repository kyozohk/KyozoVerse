'use client';

import React, { Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import CommunitySidebar from '@/components/layout/community-sidebar';
import { PageLoadingSkeleton } from '@/components/community/page-loading-skeleton';
import { communityNavItems } from '@/lib/theme-utils';
import { useIsMobile } from '@/hooks/use-mobile';

export default function CommunityLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { handle: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  // Invite-join flow (`/[handle]/join`) is a PUBLIC signup screen. Skip the
  // community sidebar chrome so unauthenticated invitees see a clean form.
  const isJoinPath = /^\/[^/]+\/join(\/.*)?$/.test(pathname);

  if (isJoinPath) {
    return <div className="min-h-full">{children}</div>;
  }

  if (isMobile) {
    const segments = pathname.split('/').filter(Boolean);
    const handle = segments[0];

    // Community root: only the nav sidebar, full screen.
    if (segments.length === 1) {
      return (
        <div className="h-[100dvh] w-full overflow-hidden">
          <CommunitySidebar />
        </div>
      );
    }

    // Nav item content: full screen with a back header to return to the sidebar.
    const navItem = communityNavItems.find(
      item => item.href(handle).split('/').filter(Boolean)[1] === segments[1]
    );
    const navLabel = navItem?.label
      ?? (segments[1] === 'qr' ? 'Join QR' : segments[1].charAt(0).toUpperCase() + segments[1].slice(1));
    const backPath = segments.length > 2 ? `/${segments.slice(0, -1).join('/')}` : `/${handle}`;

    return (
      <div className="flex h-[100dvh] w-full flex-col overflow-hidden">
        <header
          className="flex h-14 flex-shrink-0 items-center gap-1 border-b px-2"
          style={{ backgroundColor: 'hsl(var(--sidebar-background))' }}
        >
          <button
            onClick={() => router.push(backPath)}
            className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent"
            aria-label="Back"
          >
            <ChevronLeft className="h-6 w-6 text-foreground" />
          </button>
          <span className="truncate text-base font-semibold text-foreground">{navLabel}</span>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Suspense fallback={<PageLoadingSkeleton showMemberList={true} />}>
            {children}
          </Suspense>
        </main>
      </div>
    );
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
