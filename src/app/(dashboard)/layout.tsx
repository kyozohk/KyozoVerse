
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useCallback, useState } from 'react';
import { 
  LogOut, 
  Loader2
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
// Use signOut from useAuth hook instead of importing directly
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { SidebarNavItem } from '@/components/ui/sidebar-nav-item';
import { getThemeForPath, mainNavItems } from '@/lib/theme-utils';


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/landing');
    } else if (pathname === '/dashboard') {
      // Redirect from old path to new path
      router.replace('/communities');
    }
  }, [user, loading, router, pathname]);

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
  
  const fallback = user.displayName ? user.displayName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U');

  const { section: currentSection, activeColor, activeBgColor } = getThemeForPath(pathname);

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar className={`sidebar-bg-${currentSection}`}>
          <SidebarHeader>
            <div className="flex h-[80px] items-center justify-center p-2">
              <Link href="/communities" className="flex items-center justify-center" onClick={handleLogoClick}>
                {/* Expanded Logo */}
                <Image src="/logo.png" alt="Kyozo Logo" width={120} height={41} className="group-data-[collapsible=icon]:hidden" style={{ height: 'auto' }} />
                {/* Collapsed Icon */}
                <Image src="/favicon.png" alt="Kyozo Icon" width={41} height={41} className="hidden group-data-[collapsible=icon]:block" />
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
                        activeColor={`var(--${item.section}-color-active)`}
                        activeBgColor={`var(--${item.section}-color-border)`}
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
                    activeColor={`var(--${currentSection}-color-active)`}
                    activeBgColor={`var(--${currentSection}-color-border)`}
                >
                    <span className="group-data-[collapsible=icon]:hidden">Log Out</span>
                </SidebarNavItem>
              </SidebarMenu>
            </div>
          </SidebarFooter>
        </Sidebar>
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
