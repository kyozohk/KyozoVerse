import { Skeleton } from '@/components/ui/skeleton';

export function MemberListItemSkeleton() {
  return (
    <div className="flex items-center p-3 border rounded-md">
      <div className="mr-3">
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <div className="flex-grow">
        <Skeleton className="h-5 w-32 mb-2" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div>
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export function MemberListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array(count).fill(0).map((_, i) => (
        <MemberListItemSkeleton key={i} />
      ))}
    </div>
  );
}
