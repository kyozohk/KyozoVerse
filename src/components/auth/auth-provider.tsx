"use client";

import { useAuth } from "@/hooks/use-auth.tsx";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/auth";
import { PostCardSkeleton } from "@/components/feed/post-card-skeleton";

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, loading, setUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser && pathname !== '/login') {
         // router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [setUser, router, pathname]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
