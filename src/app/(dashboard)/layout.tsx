
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useCallback, useState } from 'react';
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
  SidebarFooter, 
  SidebarInset, 
  SidebarProvider 
} from '@/components/ui/enhanced-sidebar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { signOut as firebaseSignOut } from '@/firebase/auth';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { SidebarNavItem } from '@/components/ui/sidebar-nav-item';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, auth } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    } else if (pathname === '/dashboard') {
      // Redirect from old path to new path
      router.replace('/communities');
    }
  }, [user, loading, router, pathname]);

  const handleLogout = async () => {
    if (auth) {
      await firebaseSignOut(auth);
    }
    router.push('/');
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

  const navItems = [
    { href: '/communities', icon: <LayoutGrid />, label: 'Communities', section: 'communities' },
    { href: '/analytics', icon: <BarChart3 />, label: 'Analytics', section: 'analytics' },
    { href: '/subscription', icon: <CreditCard />, label: 'Subscription', section: 'subscription' },
    { href: '/account', icon: <Settings />, label: 'Settings', section: 'settings' },
  ];

  const getSectionFromPath = (path: string) => {
    if (path.startsWith('/communities')) return 'communities';
    const currentItem = navItems.find(item => path.startsWith(item.href));
    return currentItem?.section || 'communities';
  };

  const currentSection = getSectionFromPath(pathname);

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar className={`sidebar-bg-${currentSection}`}>
          <SidebarHeader>
            <div className="flex items-center justify-center p-2">
              <Link href="/dashboard" className="flex items-center justify-center" onClick={handleLogoClick}>
                {/* Expanded Logo */}
                <Image src="/logo.png" alt="Kyozo Logo" width={144} height={41} className="group-data-[collapsible=icon]:hidden" style={{ height: 'auto' }} />
                {/* Collapsed Icon */}
                <Image src="/favicon.png" alt="Kyozo Icon" width={41} height={41} className="hidden group-data-[collapsible=icon]:block" />
              </Link>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarNavItem
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    activeColor={`var(--${item.section}-color-active)`}
                    activeBgColor={`var(--${item.section}-color-border)`}
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
