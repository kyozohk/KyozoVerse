
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
        
        <div className="space-y-3 md:space-y-4 mb-4">
          <div className="flex items-center gap-3 md:gap-4">
            <Skeleton className="h-14 w-14 md:h-16 md:h-16 lg:w-20 lg:h-20 rounded-full flex-shrink-0" />
            <div className="flex-1">
              <div className="h-16 md:h-20 lg:h-24 flex items-center gap-0.5">
                  {[...Array(60)].map((_, i) => (
                    <Skeleton key={i} className="flex-1 rounded-full" style={{ height: `${Math.random() * 60 + 20}%` }} />
                  ))}
              </div>
              <div className="flex justify-between mt-2">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-3 w-10" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-start gap-2 pt-4">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </Card>
  );
}
