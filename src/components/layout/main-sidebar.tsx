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

export default function MainSidebar() {
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
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-20 flex-col border-r sm:flex" style={{ backgroundColor: 'hsl(var(--sidebar-background))' }}>
            <div className="flex h-full flex-col p-2">
                <div className="flex h-[76px] items-center justify-center">
                    <div className="flex items-center justify-center">
                        <Image src="/favicon.svg" alt="Kyozo" width={50} height={50} />
                    </div>
                </div>
                
                <nav className="flex flex-1 flex-col items-center gap-y-2 py-5">
                    {navItems.map((item) => (
                        <SidebarNavItem 
                            key={item.label} 
                            href={item.href} 
                            icon={item.icon}
                            className="w-full justify-center"
                        >
                            <span className="sr-only">{item.label}</span>
                        </SidebarNavItem>
                    ))}
                </nav>

                <div className="flex flex-col items-center gap-y-2 mt-auto pb-2">
                    <SidebarNavItem 
                        href="/account" 
                        icon={<User />}
                        className="w-full justify-center"
                    >
                        <span className="sr-only">Account</span>
                    </SidebarNavItem>
                    <button
                        onClick={handleLogout}
                        className="flex h-12 w-12 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="sr-only">Logout</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
