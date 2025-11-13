
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { 
  BarChart3, 
  CreditCard, 
  Settings, 
  LogOut, 
  LayoutGrid, 
  Loader2
} from 'lucide-react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarFooter, 
  SidebarInset, 
  SidebarProvider 
} from '@/components/ui/enhanced-sidebar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { signOut } from '@/firebase/auth';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import CommunitySidebar from '@/components/layout/community-sidebar';

const mainNavItems = [
    { href: '/communities', icon: LayoutGrid, label: 'Communities', section: 'communities' },
    { href: '/analytics', icon: BarChart3, label: 'Analytics', section: 'analytics' },
    { href: '/subscription', icon: CreditCard, label: 'Subscription', section: 'subscription' },
    { href: '/settings', icon: Settings, label: 'Settings', section: 'settings' },
];

const communityNavItems = [
    { href: (handle: string) => `/${handle}`, icon: LayoutDashboard, label: 'Overview', section: 'communities' },
    { href: (handle: string) => `/${handle}/members`, icon: Users, label: 'Members', section: 'communities' },
    { href: (handle: string) => `/${handle}/broadcast`, icon: Bell, label: 'Broadcast', section: 'communities' },
    { href: (handle: string) => `/${handle}/inbox`, icon: Inbox, label: 'Inbox', section: 'communities' },
    { href: (handle: string) => `/${handle}/feed`, icon: Rss, label: 'Feed', section: 'communities' },
    { href: (handle: string) => `/${handle}/ticketing`, icon: Ticket, label: 'subscription' },
    { href: (handle: string) => `/${handle}/integrations`, icon: Plug, label: 'settings' },
    { href: (handle: string) => `/${handle}/analytics`, icon: BarChart, label: 'analytics' },
];

const getSectionFromPath = (path: string) => {
    const handle = path.split('/')[1];
    const subRoute = path.split('/')[2];

    if (handle) {
        const communityNavItem = communityNavItems.find(item => {
            const itemPath = item.href(handle);
            return path === itemPath || (itemPath.endsWith(handle) && !subRoute) || (subRoute && itemPath.endsWith(subRoute));
        });
        if (communityNavItem) {
            return communityNavItem.section;
        }
    }
    
    const mainNavItem = mainNavItems.find(item => path.startsWith(item.href));
    return mainNavItem?.section || 'communities';
};


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const isCommunityPage = /^\/[^/]+/.test(pathname) && !mainNavItems.some(item => pathname.startsWith(item.href));

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    setSidebarOpen(!isCommunityPage);
  }, [isCommunityPage]);

  const handleLogout = async () => {
    await signOut();
    router.push('/landing');
  };

  const handleLogoClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setSidebarOpen(prev => !prev);
  }, []);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const fallback = user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email!.charAt(0).toUpperCase();

  const currentSection = getSectionFromPath(pathname);

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar className={`sidebar-bg-${currentSection}`}>
          <SidebarHeader>
            <div className="flex items-center justify-center p-2">
              <Link href="/communities" className="flex items-center justify-center" onClick={handleLogoClick}>
                {/* Expanded Logo */}
                <Image src="/logo.png" alt="Kyozo Logo" width={144} height={41} className="group-data-[collapsible=icon]:hidden" style={{ height: 'auto' }} />
                {/* Collapsed Icon */}
                <Image src="/favicon.png" alt="Kyozo Icon" width={41} height={41} className="hidden group-data-[collapsible=icon]:block" />
              </Link>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href} passHref>
                    <SidebarMenuButton isActive={pathname.startsWith(item.href)} tooltip={item.label}>
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
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
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleLogout} tooltip="Log Out">
                    <LogOut />
                    <span>Log Out</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          </SidebarFooter>
        </Sidebar>
        
        <CommunitySidebar />
        
        <SidebarInset 
          style={{ 
            backgroundImage: `url('/bg/light_app_bg.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            paddingLeft: isCommunityPage ? '0' : undefined
          }}
        >
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
