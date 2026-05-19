'use client';

import { Skeleton } from '@/components/ui/skeleton';

interface PageLoadingSkeletonProps {
  showMemberList?: boolean;
  showFeed?: boolean;
  showInbox?: boolean;
  /** Number of table rows in the member list skeleton. */
  memberRows?: number;
}

/**
 * Page-level loading skeleton.
 *
 * Renders a structural preview that mirrors the eventual layout — header
 * banner + CTAs, search row, table rows / feed cards / inbox split.
 * Keep this in lockstep with the real page so the transition from skeleton
 * to data doesn't reflow the viewport.
 */
export function PageLoadingSkeleton({
  showMemberList = true,
  showFeed = false,
  showInbox = false,
  memberRows = 10,
}: PageLoadingSkeletonProps) {
  return (
    <div
      className="h-screen flex flex-col"
      style={{ backgroundColor: 'var(--page-bg-color)' }}
    >
      <div className="p-8 flex-1 flex flex-col">
        <div
          className="rounded-2xl overflow-hidden flex-1 flex flex-col"
          style={{
            backgroundColor: 'var(--page-content-bg)',
            border: '2px solid var(--page-content-border)',
          }}
        >
          {/* Banner — page title on the left, 3 CTAs on the right.
              Audience / Feed / Inbox / Schedule pages all share this header. */}
          <div className="px-8 py-6 flex items-center justify-between gap-4 border-b" style={{ borderColor: 'var(--page-content-border)' }}>
            <Skeleton className="h-9 w-48" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-28 rounded-md" />
              <Skeleton className="h-10 w-36 rounded-md" />
              <Skeleton className="h-10 w-32 rounded-md" />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 flex-1 flex flex-col gap-4 min-h-0">
            {showMemberList && <MemberTableSkeleton rows={memberRows} />}
            {showFeed && <FeedSkeleton />}
            {showInbox && <InboxSkeleton />}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Audience-page skeleton — matches the loaded layout:
 *   1. Full-width search
 *   2. Select-all row with Manage Tag button + view-mode toggles
 *   3. Table header (Name / Email / User Type / Tags / Added)
 *   4. N rows: checkbox + avatar + 5 column placeholders
 */
function MemberTableSkeleton({ rows }: { rows: number }) {
  return (
    <>
      {/* Search */}
      <Skeleton className="h-12 w-full rounded-md" />

      {/* Select-all row + actions */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-9 w-32 rounded-md" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </div>

      {/* Table header */}
      <div
        className="grid items-center gap-4 px-4 py-3 rounded-md"
        style={{
          gridTemplateColumns: '24px 1fr 1.4fr 0.8fr 0.8fr 0.7fr',
          backgroundColor: 'rgba(0,0,0,0.02)',
        }}
      >
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-3.5 w-14" />
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-3.5 w-12" />
        <Skeleton className="h-3.5 w-14" />
      </div>

      {/* Rows */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col gap-1">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="grid items-center gap-4 px-4 py-3 border-b last:border-b-0"
            style={{
              gridTemplateColumns: '24px 1fr 1.4fr 0.8fr 0.8fr 0.7fr',
              borderColor: 'var(--page-content-border, rgba(0,0,0,0.05))',
            }}
          >
            <Skeleton className="h-4 w-4 rounded" />
            <div className="flex items-center gap-3 min-w-0">
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </>
  );
}

function FeedSkeleton() {
  return (
    <>
      {/* Stats row */}
      <div className="flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-32 rounded-lg" />
        ))}
      </div>

      {/* Feed cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg overflow-hidden border" style={{ borderColor: 'var(--page-content-border, rgba(0,0,0,0.05))' }}>
            <Skeleton className="h-40 w-full rounded-none" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function InboxSkeleton() {
  return (
    <div className="flex gap-4 flex-1 min-h-0">
      {/* Conversations list */}
      <div className="w-80 space-y-2 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
      {/* Message area */}
      <div className="flex-1 border-l pl-4 flex flex-col gap-3" style={{ borderColor: 'var(--page-content-border, rgba(0,0,0,0.05))' }}>
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-16 w-3/4" />
        <Skeleton className="h-12 w-2/3 ml-auto" />
        <Skeleton className="h-16 w-3/4" />
      </div>
    </div>
  );
}

/**
 * Standalone banner skeleton — for components that render only the banner
 * (e.g. lazy-loaded sub-views below an already-shown header).
 */
export function BannerSkeleton() {
  return (
    <div className="px-8 py-6 flex items-center justify-between gap-4 border-b" style={{ borderColor: 'var(--page-content-border)' }}>
      <Skeleton className="h-9 w-48" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-28 rounded-md" />
        <Skeleton className="h-10 w-36 rounded-md" />
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
    </div>
  );
}

/** Just the member-table portion — useful below an existing banner. */
export function MemberListSkeleton({ rows = 10 }: { rows?: number } = {}) {
  return (
    <div className="p-6 flex-1 flex flex-col gap-4 min-h-0">
      <MemberTableSkeleton rows={rows} />
    </div>
  );
}
