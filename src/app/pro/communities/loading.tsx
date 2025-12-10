import { Skeleton } from '@/components/ui/skeleton';
import { CommunityCardSkeleton } from '@/components/community/community-card-skeleton';

export default function DashboardLoading() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-40" />
      </div>
      
      <div className="flex items-center justify-between mb-6 gap-4">
        <Skeleton className="h-10 flex-grow" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
      
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CommunityCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
