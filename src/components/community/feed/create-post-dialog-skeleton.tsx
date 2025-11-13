import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function CreatePostDialogSkeleton() {
  return (
    <Card className="p-6 w-full max-w-md mx-auto">
      <div className="flex flex-col space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        
        <div className="border border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center">
          <Skeleton className="h-10 w-10 rounded-full mb-2" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24 mt-1" />
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
    </Card>
  );
}
