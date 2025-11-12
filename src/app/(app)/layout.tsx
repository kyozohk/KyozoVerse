'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
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
import { SidebarNavItem } from '@/components/layout/sidebar-nav-item';
import { SidebarText } from '@/components/ui/sidebar-text';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await signOut();
    router.push('/landing');
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const fallback = user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email!.charAt(0).toUpperCase();

  const navItems = [
    { href: '/communities', icon: LayoutGrid, label: 'Communities', section: 'communities' },
    { href: '/analytics', icon: BarChart3, label: 'Analytics', section: 'analytics' },
    { href: '/subscription', icon: CreditCard, label: 'Subscription', section: 'subscription' },
    { href: '/account', icon: Settings, label: 'Settings', section: 'settings' },
  ];

  const getSectionFromPath = (path: string) => {
    if (path.startsWith('/communities')) return 'communities';
    const currentItem = navItems.find(item => path.startsWith(item.href));
    return currentItem?.section || 'communities';
  };

  // Check if we're in a community page
  const isInCommunityPage = pathname.split('/').length > 2 && pathname.split('/')[1] !== '' && 
    !['communities', 'analytics', 'subscription', 'account', 'dashboard'].includes(pathname.split('/')[1]);

  const currentSection = getSectionFromPath(pathname);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <div className="flex flex-shrink-0">
          <Sidebar 
            className={`sidebar-bg-${currentSection} ${isInCommunityPage ? 'w-20' : 'w-64'}`}
          >
            <SidebarHeader>
              <div className="flex h-[69px] items-center justify-center p-2">
                <Link href="/communities" className="flex items-center justify-center">
                  {/* Expanded Logo */}
                  <Image 
                    src="/logo.png" 
                    alt="Kyozo Logo" 
                    width={144} 
                    height={41} 
                    className={`${isInCommunityPage ? 'hidden' : 'block'}`} 
                    style={{ height: 'auto' }} 
                  />
                  {/* Collapsed Icon */}
                  <Image 
                    src="/favicon.png" 
                    alt="Kyozo Icon" 
                    width={41} 
                    height={41} 
                    className={`${isInCommunityPage ? 'block' : 'hidden'}`} 
                  />
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
                    label={item.label}
                    isActive={pathname.startsWith(item.href)}
                    isCollapsed={isInCommunityPage}
                    section={item.section}
                  />
                ))}
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
              <div className={`flex flex-col gap-2 p-2 ${isInCommunityPage ? 'items-center' : ''}`}>
                <div className={`flex items-center gap-2 p-2 ${isInCommunityPage ? 'p-0' : ''}`}>
                  <Avatar className="h-8 w-8 border-2 border-primary/10">
                    <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
                    <AvatarFallback>{fallback}</AvatarFallback>
                  </Avatar>
                  <div className={`flex flex-col ${isInCommunityPage ? 'hidden' : 'block'}`}>
                    <SidebarText className="text-sm font-medium leading-none">{user.displayName || user.email}</SidebarText>
                    <SidebarText className="text-xs text-white/70">{user.email}</SidebarText>
                  </div>
                </div>
                <SidebarMenu className={`${isInCommunityPage ? 'p-0' : ''}`}>
                  <SidebarMenuButton 
                      onClick={handleLogout} 
                      tooltip="Log Out"
                      className={`text-white hover:text-white ${
                        isInCommunityPage ? 'justify-center' : ''
                      }`}
                      style={{ textShadow: '0px 0px 1px rgba(0,0,0,0.5)' }}
                    >
                      <LogOut className="h-5 w-5 text-white group-hover:text-white" style={{ filter: 'drop-shadow(0px 0px 1px rgba(0,0,0,0.5))' }}/>
                      <SidebarText className={`text-base ${isInCommunityPage ? 'hidden' : 'block'}`}>Log Out</SidebarText>
                    </SidebarMenuButton>
                </SidebarMenu>
              </div>
            </SidebarFooter>
          </Sidebar>
          <CommunitySidebar />
        </div>
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
