
import { Skeleton } from "@/components/ui/skeleton";

export function TextPostCardSkeleton({ hasImage = true }: { hasImage?: boolean }) {
  const cardStyle = {
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
    backgroundColor: 'rgb(245, 241, 232)'
  };
  const innerDivStyle = {
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E\")"
  };

  return (
    <div className="bg-white overflow-hidden shadow-md border border-neutral-200" style={cardStyle}>
      <div className="p-4 md:p-6 lg:p-8 flex flex-col justify-between" style={innerDivStyle}>
        <div className="flex flex-col gap-3 md:gap-4 lg:gap-6">
          <div className="flex flex-col gap-2 md:gap-3 lg:gap-5">
            <div className="flex items-center gap-2 md:gap-2.5">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-4 w-24 rounded-full" />
            </div>
            <Skeleton className="h-8 w-3/4 mb-2 rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-[90%] rounded-md" />
          </div>
        </div>
        <div className="pt-4 md:pt-5 lg:pt-7 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
            </div>
            <Skeleton className="h-4 w-24 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
