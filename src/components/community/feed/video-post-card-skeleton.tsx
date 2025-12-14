
import { Skeleton } from "@/components/ui/skeleton";

export function VideoPostCardSkeleton() {
  const cardStyle = {
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.1'/%3E%3C/svg%3E\")",
    backgroundColor: 'rgb(245, 241, 232)'
  };
  
  return (
    <div className="relative bg-neutral-900 overflow-hidden shadow-md border border-neutral-200 min-h-[400px]" style={cardStyle}>
      <Skeleton className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      
      <div className="relative z-10 p-4 md:p-6 flex flex-col justify-between h-full min-h-[400px]">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        
        <div>
          <Skeleton className="h-7 w-3/4 mb-4" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-16 rounded-md" />
                <Skeleton className="h-8 w-16 rounded-md" />
                <Skeleton className="h-8 w-16 rounded-md" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
