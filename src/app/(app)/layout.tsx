
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { 
  BarChart, 
  CreditCard, 
  Settings, 
  LogOut, 
  LayoutGrid, 
  Loader2,
  Users,
  Bell,
  Inbox,
  Rss,
  Ticket,
  Plug,
  LayoutDashboard
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
import { signOut } from 'firebase/auth';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import CommunitySidebar from '@/components/layout/community-sidebar';
import { SidebarNavItem } from '@/components/ui/sidebar-nav-item';
import { getThemeForPath, mainNavItems, communityNavItems } from '@/lib/theme-utils';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, auth } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const isCommunityPage = /^\/[^/]+/.test(pathname) && !mainNavItems.some(item => pathname.startsWith(item.href));
  
  const [sidebarOpen, setSidebarOpen] = useState(!isCommunityPage);

  const handleLogoClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (isCommunityPage) {
        // If on a community page, clicking the logo should take you back to the communities list
        router.push('/communities');
    } else {
        // On main pages, toggle the sidebar
        setSidebarOpen(prev => !prev);
    }
  }, [isCommunityPage, router]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/landing');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    // Automatically collapse the main sidebar when navigating to a community page
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

  const { section: currentSection, activeColor, activeBgColor } = getThemeForPath(pathname);

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar className={`sidebar-bg-${currentSection}`}>
          <SidebarHeader>
            <div className="flex h-[60px] items-center justify-center p-2">
              <Link href="/communities" className="flex items-center justify-center" onClick={handleLogoClick}>
                <Image src="/logo.png" alt="Kyozo Logo" width={120} height={41} className="group-data-[collapsible=icon]:hidden" style={{ height: 'auto' }} />
                <Image src="/favicon.png" alt="Kyozo Icon" width={41} height={41} className="hidden group-data-[collapsible=icon]:block" />
              </Link>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                 <SidebarNavItem 
                    key={item.label} 
                    href={item.href} 
                    icon={item.icon}
                    isActive={item.section === currentSection}
                    activeColor={activeColor}
                    activeBgColor={activeBgColor}
                  >
                   <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                </SidebarNavItem>
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
                 <SidebarNavItem 
                    href="#"
                    icon={<LogOut />}
                    onClick={() => signOut(auth!).then(() => router.push('/landing'))}
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

