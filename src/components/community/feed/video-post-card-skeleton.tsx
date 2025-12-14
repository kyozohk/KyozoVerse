
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function VideoPostCardSkeleton() {
  const backgroundStyle = { 
    backgroundImage: `url('/bg/video_bg.png')`, 
    backgroundSize: 'cover', 
    backgroundPosition: 'center' 
  };

  return (
    <Card 
      className="overflow-hidden shadow-lg transition-all relative"
      style={backgroundStyle}
    >
      <div className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        
        <Skeleton className="h-8 w-3/4 mb-4" />
        
        <div className="space-y-2 mb-6">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[90%]" />
        </div>
        
        <div className="relative aspect-video w-full rounded-lg overflow-hidden mb-4">
          <Skeleton className="absolute inset-0" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton className="h-16 w-16 rounded-full" />
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>
    </Card>
  );
}
