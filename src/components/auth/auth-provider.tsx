"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { PostCardSkeleton } from "@/components/feed/post-card-skeleton";

// Add console logs for debugging
const publicPaths = ['/login', '/signup', '/'];

// Function to check if the current path is a handle/slug page
const isHandlePath = (path: string) => {
  // Check if the path matches the pattern /username (e.g., /kyozo, /john, etc.)
  // This regex matches paths that start with / followed by characters but not containing additional /
  return /^\/[^\/]+$/.test(path);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicPath = publicPaths.includes(pathname) || isHandlePath(pathname);
  
  console.log('AuthProvider - Path check', { 
    pathname, 
    isPublicPath, 
    isHandlePath: isHandlePath(pathname),
    user: !!user,
    loading 
  });

  useEffect(() => {
    console.log('AuthProvider - Auth check effect', { user: !!user, loading, isPublicPath });
    if (!loading && !user && !isPublicPath) {
      console.log('AuthProvider - Redirecting to login');
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
