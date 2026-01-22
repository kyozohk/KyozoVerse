'use client';

import React from 'react';
import Image from 'next/image';
import {
    BarChart3,
    CreditCard,
    Settings,
    LayoutGrid
} from 'lucide-react';
import { SidebarNavItem } from '@/components/ui/sidebar-nav-item';

export default function MainSidebar() {
    const navItems = [
        { href: '/communities', icon: <LayoutGrid />, label: 'Communities' },
        { href: '/analytics', icon: <BarChart3 />, label: 'Analytics' },
        { href: '/subscription', icon: <CreditCard />, label: 'Subscription' },
        { href: '/account', icon: <Settings />, label: 'Settings' },
    ];

    return (
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-20 flex-col border-r sm:flex" style={{ backgroundColor: 'hsl(var(--sidebar-background))' }}>
            <div className="flex h-full flex-col p-2">
                <div className="flex h-[76px] items-center justify-center">
                    <div className="flex items-center justify-center">
                        <Image src="/logo-icon.svg" alt="Kyozo" width={48} height={48} />
                    </div>
                </div>
                
                <nav className="flex flex-col items-center gap-y-2">
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
            </div>
        </aside>
    );
}
