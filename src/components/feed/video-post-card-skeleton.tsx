
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
      className="overflow-hidden shadow-lg transition-all relative min-h-[400px]"
      style={backgroundStyle}
    >
      <Skeleton className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      
      <div className="relative z-10 p-4 md:p-6 flex flex-col justify-between h-full">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        
        <div>
          <Skeleton className="h-7 w-3/4 mb-4" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
