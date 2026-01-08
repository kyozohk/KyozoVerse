'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import CommunitySidebar from '@/components/layout/community-sidebar';

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Require auth for all community routes
    if (!loading && !user) {
      router.replace(`/?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, router, pathname]);

  // For protected routes, show loading or require auth
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <CommunitySidebar />
      
      <div 
        className="flex-1 overflow-auto"
        style={{ 
          backgroundImage: `url('/bg/light_app_bg.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {children}
      </div>
    </div>
  );
}
