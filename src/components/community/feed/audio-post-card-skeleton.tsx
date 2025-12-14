
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function AudioPostCardSkeleton() {
  const backgroundStyle = { 
    backgroundImage: `url('/bg/audio_bg.png')`, 
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
        
        <div className="bg-black/10 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-2 w-full mb-2" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-3 w-10" />
              </div>
            </div>
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
          </div>
        </div>
      </div>
    </Card>
  );
}
