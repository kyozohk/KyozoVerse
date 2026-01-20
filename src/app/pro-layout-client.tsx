
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useCallback, useState, useMemo } from 'react';
import { 
  LogOut, 
  Loader2,
  Megaphone
} from 'lucide-react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu,
  SidebarFooter, 
  SidebarInset, 
  SidebarProvider 
} from '@/components/ui/enhanced-sidebar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import Image from 'next/image';
import { SidebarNavItem } from '@/components/ui/sidebar-nav-item';
import { mainNavItems } from '@/lib/theme-utils';
import CommunitySidebar from '@/components/layout/community-sidebar';

export default function ProLayoutClient({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const isCommunityPage = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    return segments.length >= 1 && !mainNavItems.some(item => item.href === `/${segments[0]}`);
  }, [pathname]);
  
  const [sidebarOpen, setSidebarOpen] = useState(!isCommunityPage);

  useEffect(() => {
    if (!loading && !user && pathname !== '/') {
      router.replace('/');
    }
  }, [user, loading, router, pathname]);

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  const handleLogoClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (isCommunityPage) {
      router.push('/communities');
    } else {
      setSidebarOpen(prev => !prev);
    }
  }, [isCommunityPage, router]);

  useEffect(() => {
    setSidebarOpen(!isCommunityPage);
  }, [isCommunityPage]);

  if (pathname === '/') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }
  
  const fallback = user.displayName ? user.displayName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U');

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar className="bg-sidebar border-border shadow-sm">
          <SidebarHeader>
            <div className="flex h-20 items-center justify-center p-4 border-b border-border">
              <Link href="/communities" className="flex items-center justify-center h-full w-full" onClick={handleLogoClick}>
                {/* Wide logo (logo-orig.png) */}
                <Image 
                  src="/logo-orig.png" 
                  alt="Kyozo" 
                  width={100} 
                  height={28}
                  className="hidden group-data-[state=expanded]:block"
                />
                {/* Narrow logo (favicon.png) */}
                <div className="hidden group-data-[state=collapsed]:flex h-10 w-10 items-center justify-center rounded-lg">
                  <Image 
                    src="/favicon.png" 
                    alt="Kyozo" 
                    width={32} 
                    height={32}
                  />
                </div>
              </Link>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarNavItem
                        key={item.href}
                        href={item.href}
                        icon={<Icon />}
                        isActive={pathname.startsWith(item.href)}
                    >
                        <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </SidebarNavItem>
                  );
              })}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <div className="flex flex-col gap-2 p-2 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:items-center">
              <div className="flex items-center gap-3 p-4">
                <Avatar className="h-10 w-10 ring-2 ring-border">
                  <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
                  <AvatarFallback>{fallback}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                  <span className="text-sm font-semibold leading-none text-[#6B6358]">{user.displayName || user.email}</span>
                  <span className="text-xs text-[#8B7355]">{user.email}</span>
                </div>
              </div>
              <SidebarMenu className="group-data-[collapsible=icon]:p-0">
                <SidebarNavItem
                    href="#"
                    icon={<LogOut />}
                    onClick={handleLogout}
                >
                    <span className="group-data-[collapsible=icon]:hidden">Log Out</span>
                </SidebarNavItem>
              </SidebarMenu>
            </div>
          </SidebarFooter>
        </Sidebar>
        
        {isCommunityPage && <CommunitySidebar />}
        
        <SidebarInset>
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
