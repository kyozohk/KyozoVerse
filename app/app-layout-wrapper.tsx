'use client';

import { usePathname } from 'next/navigation';
import MainSidebar from '@/components/layout/main-sidebar';

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Don't show sidebar on landing page
  const showSidebar = pathname !== '/';

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen">
      <MainSidebar />
      <main className="flex-1 ml-20">
        {children}
      </main>
    </div>
  );
}
