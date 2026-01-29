'use client';

import { Skeleton } from '@/components/ui/skeleton';

interface PageLoadingSkeletonProps {
  showMemberList?: boolean;
  showFeed?: boolean;
  showInbox?: boolean;
}

export function PageLoadingSkeleton({ 
  showMemberList = true, 
  showFeed = false,
  showInbox = false 
}: PageLoadingSkeletonProps) {
  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--page-bg-color)' }}>
      <div className="p-8 flex-1 flex flex-col">
        <div className="rounded-2xl overflow-hidden flex-1 flex flex-col" style={{ backgroundColor: 'var(--page-content-bg)', border: '2px solid var(--page-content-border)' }}>
          {/* Banner Skeleton */}
          <div className="relative h-64 bg-muted animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end gap-4">
              {/* Profile Image Skeleton */}
              <Skeleton className="h-20 w-20 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                {/* Title Skeleton */}
                <Skeleton className="h-8 w-64" />
                {/* Subtitle Skeleton */}
                <Skeleton className="h-4 w-48" />
                {/* Tags Skeleton */}
                <div className="flex gap-2 mt-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-14 rounded-full" />
                </div>
              </div>
              {/* CTA Buttons Skeleton */}
              <div className="flex gap-2">
                <Skeleton className="h-9 w-28 rounded-lg" />
                <Skeleton className="h-9 w-28 rounded-lg" />
              </div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="p-6 flex-1">
            {showMemberList && (
              <>
                {/* Search/Filter Bar Skeleton */}
                <div className="flex items-center gap-4 mb-6">
                  <Skeleton className="h-10 w-64 rounded-lg" />
                  <Skeleton className="h-10 w-32 rounded-lg" />
                  <Skeleton className="h-10 w-32 rounded-lg" />
                </div>
                
                {/* Member Icons Grid Skeleton - 4 rows */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-3">
                      <Skeleton className="h-20 w-20 rounded-full" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              </>
            )}

            {showFeed && (
              <>
                {/* Stats Skeleton */}
                <div className="flex gap-4 mb-6">
                  <Skeleton className="h-20 w-32 rounded-lg" />
                  <Skeleton className="h-20 w-32 rounded-lg" />
                  <Skeleton className="h-20 w-32 rounded-lg" />
                  <Skeleton className="h-20 w-32 rounded-lg" />
                </div>
                
                {/* Feed Cards Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-lg overflow-hidden">
                      <Skeleton className="h-48 w-full" />
                      <div className="p-4 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {showInbox && (
              <div className="flex gap-4 h-96">
                {/* Conversations List Skeleton */}
                <div className="w-80 space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
                {/* Message Area Skeleton */}
                <div className="flex-1 flex items-center justify-center">
                  <Skeleton className="h-16 w-16 rounded-full" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BannerSkeleton() {
  return (
    <div className="relative h-64 bg-muted animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end gap-4">
        <Skeleton className="h-20 w-20 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
          <div className="flex gap-2 mt-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function MemberListSkeleton() {
  return (
    <div className="p-6 flex-1">
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
        {Array.from({ length: 32 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-3">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
