import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function MemberCardSkeleton({ borderColor = 'hsl(var(--border))' }: { borderColor?: string }) {
  return (
    <Card 
      className="hover:shadow-lg transition-shadow duration-300 h-full"
      style={{ borderColor }}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div>
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <Skeleton className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        
        <div className="flex justify-end gap-1 pt-2">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-8 w-8 rounded-md" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
