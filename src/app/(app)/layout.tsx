
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  LogOut, 
  Loader2,
} from 'lucide-react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarFooter, 
  SidebarInset, 
  SidebarProvider,
  useSidebar
} from '@/components/ui/enhanced-sidebar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
// Import signOut from the auth hook instead of directly from firebase
import Link from 'next/link';
import Image from 'next/image';
import CommunitySidebar from '@/components/layout/community-sidebar';
import { SidebarNavItem } from '@/components/ui/sidebar-nav-item';
import { getThemeForPath, mainNavItems } from '@/lib/theme-utils';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const isCommunityPage = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    // It's a community page if the first segment is not a main nav item, and it's not a main nav item itself
    return segments.length > 0 && !mainNavItems.some(item => item.href === `/${segments[0]}`);
  }, [pathname]);
  
  const [sidebarOpen, setSidebarOpen] = useState(!isCommunityPage);

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
    if (!loading && !user) {
      router.replace('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    // When on a community page, the main sidebar should be collapsed
    // to make room for the community sidebar.
    setSidebarOpen(!isCommunityPage);
  }, [isCommunityPage]);
  
  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const fallback = user.displayName ? user.displayName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U');

  const { activeColor, activeBgColor } = getThemeForPath(pathname);
  
  const isCommunitiesActive = isCommunityPage || pathname.startsWith('/communities');

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar className="sidebar-shadow" style={{'--sidebar-active-bg': activeBgColor, '--sidebar-active-border': activeColor} as React.CSSProperties}>
          <SidebarHeader>
            <div className="flex h-[80px] items-center justify-center p-2">
              <Link href="/communities" className="flex items-center justify-center" onClick={handleLogoClick}>
                <Image src="/logo.png" alt="Kyozo Logo" width={120} height={41} className="group-data-[collapsible=icon]:hidden" style={{ height: 'auto' }} />
                <Image src="/favicon.png" alt="Kyozo Icon" width={41} height={41} className="hidden group-data-[collapsible=icon]:block" />
              </Link>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.href === '/communities' ? isCommunitiesActive : pathname.startsWith(item.href);

                  return (
                      <SidebarNavItem 
                          key={item.label} 
                          href={item.href} 
                          icon={<Icon />}
                          isActive={isActive}
                          activeColor={activeColor}
                          activeBgColor={activeBgColor}
                      >
                        <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                      </SidebarNavItem>
                  )
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
            backgroundRepeat: 'no-repeat',
          }}
        >
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
