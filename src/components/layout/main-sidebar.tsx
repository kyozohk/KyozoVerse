"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  Inbox,
  Settings,
  LogOut,
  BarChart,
  FileText,
  Replace
} from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserNav } from './user-nav';
import { Logo } from '../icons/logo';
import { useAuth } from '@/hooks/use-auth';
import { signOut } from '@/firebase/auth';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { href: '/dashboard', icon: Users, label: 'Communities' },
  { href: '/analytics', icon: BarChart, label: 'Analytics' },
  { href: '/inbox', icon: Inbox, label: 'Inbox' },
  { href: '/migrate', icon: Replace, label: 'Migrate' },
  { href: '/firebase', icon: FileText, label: 'Firebase Data' },
];

export default function MainSidebar() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };
  
  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-20 flex-col border-r bg-card sm:flex sidebar">
      <TooltipProvider>
        <nav className="flex flex-col items-center gap-4 px-2 py-4">
          <Link
            href="/dashboard"
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
          >
            <Logo className="h-5 w-5 transition-all group-hover:scale-110" />
            <span className="sr-only">KyozoVerse</span>
          </Link>
          {navItems.map((item) => (
            <Tooltip key={item.label}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={`flex h-9 w-9 items-center justify-center transition-all md:h-8 md:w-8 sidebar-nav-item ${
                    pathname.startsWith(item.href) 
                      ? 'active' 
                      : 'text-muted-foreground'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="sr-only">{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ))}
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 py-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/settings"
                className={`flex h-9 w-9 items-center justify-center transition-all md:h-8 md:w-8 sidebar-nav-item ${
                  pathname.startsWith('/settings') 
                    ? 'active' 
                    : 'text-muted-foreground'
                }`}
              >
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Settings</TooltipContent>
          </Tooltip>
          
          {user && (
            <>
              <Separator className="w-10 mx-auto" />
              
              <div className="flex flex-col items-center gap-1 px-1 py-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className="h-10 w-10 border-2 border-primary/10">
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                      <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[200px]">
                    <div className="flex flex-col gap-1">
                      <p className="font-medium">{user.displayName || 'User'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={handleSignOut}
                      className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-all hover:text-[#843484]"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="sr-only">Log out</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Log out</TooltipContent>
                </Tooltip>
              </div>
            </>
          )}
          
          {!user && <UserNav />}
        </nav>
      </TooltipProvider>
    </aside>
  );
}
