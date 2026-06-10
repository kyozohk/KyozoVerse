'use client';

import { usePathname } from 'next/navigation';
import MainSidebar from '@/components/layout/main-sidebar';

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Don't show sidebar on the landing page, or on invite/join flows.
  // Join pages (`/[handle]/join`) are publicly accessible to unauthenticated
  // invitees — they should see a clean full-width signup screen, not a
  // half-loading admin sidebar.
  const isJoinPath = /^\/[^/]+\/join(\/.*)?$/.test(pathname);
  const showSidebar = pathname !== '/' && !isJoinPath;
  
  // Check if we're on a main route (not inside a community)
  // Main routes are exact matches - community routes have handles like /kyozo-demo-community
  const isMainRoute = pathname === '/communities' || pathname === '/analytics' || pathname === '/subscription' || pathname === '/account' || pathname === '/settings/team';

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      <MainSidebar expanded={isMainRoute} />
      {/* Mobile (<md): the main sidebar is hidden, so content gets the full width. */}
      <main
        className={`min-h-screen overflow-auto ${isMainRoute ? 'md:ml-[240px]' : 'md:ml-[80px]'}`}
      >
        {children}
      </main>
    </div>
  );
}
