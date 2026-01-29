'use client';

import React from 'react';
import Image from 'next/image';
import {
    BarChart3,
    CreditCard,
    Settings,
    LayoutGrid,
    User,
    LogOut
} from 'lucide-react';
import { SidebarNavItem } from '@/components/ui/sidebar-nav-item';
import { useAuth } from '@/hooks/use-auth';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase/auth';
import { useRouter } from 'next/navigation';

interface MainSidebarProps {
    expanded?: boolean;
}

export default function MainSidebar({ expanded = false }: MainSidebarProps) {
    const { user } = useAuth();
    const router = useRouter();

    const navItems = [
        { href: '/communities', icon: <LayoutGrid />, label: 'Communities' },
        { href: '/analytics', icon: <BarChart3 />, label: 'Analytics' },
        { href: '/subscription', icon: <CreditCard />, label: 'Subscription' },
        { href: '/account', icon: <Settings />, label: 'Settings' },
    ];

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <aside 
            className={`fixed inset-y-0 left-0 z-10 hidden flex-col border-r sm:flex transition-all duration-300 ${expanded ? 'w-60' : 'w-20'}`} 
            style={{ backgroundColor: 'hsl(var(--sidebar-background))' }}
        >
            <div className="flex h-full flex-col p-2">
                <div className="flex h-[76px] items-center justify-center">
                    <div className={`flex items-center ${expanded ? 'gap-3' : 'justify-center'}`}>
                        <Image src="/favicon.svg" alt="Kyozo" width={50} height={50} />
                        {expanded && <span className="text-xl font-bold" style={{ color: '#5B4A3A' }}>Kyozo</span>}
                    </div>
                </div>
                
                <nav className={`flex flex-1 flex-col gap-y-2 py-5 ${expanded ? 'items-stretch' : 'items-center'}`}>
                    {navItems.map((item) => (
                        <SidebarNavItem 
                            key={item.label} 
                            href={item.href} 
                            icon={item.icon}
                            className={expanded ? 'w-full justify-start px-4' : 'w-full justify-center'}
                        >
                            {expanded ? <span className="ml-3">{item.label}</span> : <span className="sr-only">{item.label}</span>}
                        </SidebarNavItem>
                    ))}
                </nav>

                <div className={`flex flex-col gap-y-2 mt-auto pb-2 ${expanded ? 'items-stretch' : 'items-center'}`}>
                    <SidebarNavItem 
                        href="/account" 
                        icon={<User />}
                        className={expanded ? 'w-full justify-start px-4' : 'w-full justify-center'}
                    >
                        {expanded ? <span className="ml-3">Account</span> : <span className="sr-only">Account</span>}
                    </SidebarNavItem>
                    <button
                        onClick={handleLogout}
                        className={`flex items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground ${expanded ? 'h-12 w-full justify-start px-4 gap-3' : 'h-12 w-12 justify-center'}`}
                    >
                        <LogOut className="h-5 w-5" />
                        {expanded ? <span>Logout</span> : <span className="sr-only">Logout</span>}
                    </button>
                </div>
            </div>
        </aside>
    );
}
