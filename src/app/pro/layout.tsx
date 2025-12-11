
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
import { getThemeForPath, mainNavItems } from '@/lib/theme-utils';
import CommunitySidebar from '@/components/layout/community-sidebar';

export default function ProLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // Check if we're on a community-specific page
  const isCommunityPage = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    // /pro/[handle]/... routes are community pages
    return segments.length >= 2 && segments[0] === 'pro' && segments[1] !== 'communities' && segments[1] !== 'analytics' && segments[1] !== 'subscription' && segments[1] !== 'settings' && segments[1] !== 'account';
  }, [pathname]);
  
  const [sidebarOpen, setSidebarOpen] = useState(!isCommunityPage);

  useEffect(() => {
    // Require auth for all /pro routes except /pro landing page
    if (!loading && !user && pathname !== '/pro' && pathname.startsWith('/pro')) {
      router.replace('/pro');
    }
  }, [user, loading, router, pathname]);

  const handleLogout = async () => {
    await signOut();
    router.push('/pro');
  };

  const handleLogoClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (isCommunityPage) {
      router.push('/pro/communities');
    } else {
      setSidebarOpen(prev => !prev);
    }
  }, [isCommunityPage, router]);

  useEffect(() => {
    // When on a community page, collapse the main sidebar
    setSidebarOpen(!isCommunityPage);
  }, [isCommunityPage]);

  // If on landing page (/pro), render without sidebar
  if (pathname === '/pro') {
    return <>{children}</>;
  }

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
  
  const fallback = user.displayName ? user.displayName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U');

  const { activeColor, activeBgColor } = getThemeForPath(pathname);

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar className="sidebar-shadow" style={{'--sidebar-active-bg': activeBgColor, '--sidebar-active-border': activeColor} as React.CSSProperties}>
          <SidebarHeader>
            <div className="flex h-[80px] items-center justify-center p-2">
              <Link href="/pro/communities" className="flex items-center justify-center" onClick={handleLogoClick}>
                <Image src="/logo.png" alt="Kyozo Logo" width={120} height={41} className="group-data-[collapsible=icon]:hidden" style={{ height: 'auto' }} />
                <Image src="/favicon.png" alt="Kyozo Icon" width={41} height={41} className="hidden group-data-[collapsible=icon]:block" />
              </Link>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                  const Icon = item.icon;
                  const href = item.href.replace('/communities', '/pro/communities');
                  return (
                    <SidebarNavItem
                        key={item.href}
                        href={href}
                        icon={<Icon />}
                        isActive={pathname.startsWith(href)}
                        activeColor={activeColor}
                        activeBgColor={activeBgColor}
                    >
                        <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </SidebarNavItem>
                  );
              })}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <div className="flex flex-col gap-2 p-2 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:items-center">
              <div className="flex items-center gap-2 p-2 group-data-[collapsible=icon]:p-0">
                <Avatar className="h-8 w-8 border-2 border-primary/10">
                  <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
                  <AvatarFallback>{fallback}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                  <span className="text-sm font-medium leading-none">{user.displayName || user.email}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
              <SidebarMenu className="group-data-[collapsible=icon]:p-0">
                <SidebarNavItem
                    href="#"
                    icon={<LogOut />}
                    onClick={handleLogout}
                    activeColor={activeColor}
                    activeBgColor={activeBgColor}
                >
                    <span className="group-data-[collapsible=icon]:hidden">Log Out</span>
                </SidebarNavItem>
              </SidebarMenu>
            </div>
          </SidebarFooter>
        </Sidebar>
        
        {isCommunityPage && <CommunitySidebar />}
        
        <SidebarInset 
          style={{ 
            backgroundImage: `url('/bg/light_app_bg.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
