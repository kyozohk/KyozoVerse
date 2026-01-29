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
    <div className="min-h-screen">
      <MainSidebar expanded={isMainRoute} />
      <main 
        className="min-h-screen overflow-auto"
        style={{ marginLeft: isMainRoute ? '240px' : '80px' }}
      >
        {children}
      </main>
    </div>
  );
}
