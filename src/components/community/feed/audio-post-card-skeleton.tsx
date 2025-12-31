
import { Skeleton } from "@/components/ui/skeleton";

export function AudioPostCardSkeleton() {
  const cardStyle = {
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.1'/%3E%3C/svg%3E\")",
    backgroundColor: 'rgb(245, 241, 232)'
  };
  const innerDivStyle = {
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E\")"
  };

  return (
    <div className="bg-white overflow-hidden shadow-md border border-neutral-200" style={cardStyle}>
      <div className="p-4 md:p-6 lg:p-8 h-full flex flex-col justify-between" style={innerDivStyle}>
        <div className="flex flex-col gap-3 md:gap-4 lg:gap-6">
          <div className="flex flex-col gap-2 md:gap-3 lg:gap-5">
            <div className="flex items-center gap-2 md:gap-2.5">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-4 w-24 rounded-full" />
            </div>
            <Skeleton className="h-8 w-3/4 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-[90%] rounded-md" />
            </div>
          </div>
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center gap-3 md:gap-4">
              <Skeleton className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-[2px] h-16 md:h-20 lg:h-24">
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
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
