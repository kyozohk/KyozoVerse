'use client';

import { usePathname } from 'next/navigation';
import MainSidebar from '@/components/layout/main-sidebar';

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Don't show sidebar on landing page
  const showSidebar = pathname !== '/';
  
  // Check if we're on a main route (not inside a community)
  // Main routes are exact matches - community routes have handles like /kyozo-demo-community
  const isMainRoute = pathname === '/communities' || pathname === '/analytics' || pathname === '/subscription' || pathname === '/account';

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen">
      <MainSidebar expanded={isMainRoute} />
      <main className={`flex-1 overflow-auto ${isMainRoute ? 'ml-64' : 'ml-20'}`}>
        {children}
      </main>
    </div>
  );
}
