
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function TextPostCardSkeleton({ hasImage = true }: { hasImage?: boolean }) {
  const backgroundStyle = { 
    backgroundImage: `url('/bg/text_bg.png')`, 
    backgroundSize: 'cover', 
    backgroundPosition: 'center' 
  };

  return (
    <Card 
      className="overflow-hidden shadow-lg transition-all relative"
      style={backgroundStyle}
    >
      <div className="flex flex-col md:flex-row">
        {hasImage && (
          <div className="w-full md:w-1/3 h-48 md:h-auto overflow-hidden relative">
            <Skeleton className="absolute inset-0" />
          </div>
        )}
        <div className={`p-6 flex flex-col justify-between w-full ${hasImage ? 'md:w-2/3' : ''} text-black`}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[90%]" />
              <Skeleton className="h-4 w-[80%]" />
            </div>
          </div>
          <div className="flex items-center justify-between text-sm mt-4">
            <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>
    </Card>
  );
}
