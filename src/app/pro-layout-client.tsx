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
import { Logo } from '@/components/icons/logo';

export default function ProLayoutClient({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const isCommunityPage = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    return segments.length >= 1 && segments[0] !== 'communities' && segments[0] !== 'analytics' && segments[0] !== 'subscription' && segments[0] !== 'settings' && segments[0] !== 'account';
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

  const { activeColor, activeBgColor } = getThemeForPath(pathname);

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar className="sidebar-shadow" style={{'--sidebar-active-bg': activeBgColor, '--sidebar-active-border': activeColor} as React.CSSProperties}>
          <SidebarHeader>
            <div className="flex h-[80px] items-center justify-center p-2">
              <Link href="/communities" className="flex items-center justify-center gap-2" onClick={handleLogoClick}>
                <Logo className="h-6 w-6 text-primary" />
                <span className="font-bold text-xl text-primary group-data-[collapsible=icon]:hidden">Kyozo</span>
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
                  <span className="text-sm font-medium leading-none text-primary">{user.displayName || user.email}</span>
                  <span className="text-xs text-primary/80">{user.email}</span>
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
        
        <SidebarInset>
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
