
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { PostCardSkeleton } from "@/components/feed/post-card-skeleton";

const staticPublicPaths = ['/login', '/signup', '/'];
// These are paths that are part of the app's internal structure and should be protected.
const protectedBasePaths = ['/settings'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isStaticPublicPath = staticPublicPaths.includes(pathname);
  
  // Check if the current path starts with any of the protected base paths.
  const isProtectedRoute = protectedBasePaths.some(path => pathname.startsWith(path));

  // A path is considered public if it's in our static list, or if it's not an explicitly protected route.
  // This allows dynamic community routes like `/[handle]` to be publicly accessible.
  const isPublicPath = isStaticPublicPath || !isProtectedRoute;

  useEffect(() => {
    if (!loading && !user && !isPublicPath) {
      router.push('/login');
    }
  }, [user, loading, router, pathname, isPublicPath]);


  if (loading && !isPublicPath) {
    return (
      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        <div className="flex-1 flex flex-col">
           <main className="flex-1 overflow-y-auto bg-secondary p-4 sm:p-6 lg:p-8">
             <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <PostCardSkeleton />
                    <PostCardSkeleton />
                    <PostCardSkeleton />
                    <PostCardSkeleton />
                </div>
              </div>
           </main>
        </div>
      </div>
    );
  }
  
  if (!user && !isPublicPath) {
    // Return null or a loader while redirecting
    return null;
  }

  return <>{children}</>;
}
