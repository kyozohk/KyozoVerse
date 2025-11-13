'use client';

import React from 'react';
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
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-20 flex-col border-r bg-card sm:flex">
            <nav className="flex flex-col items-center gap-4 px-2 py-4">
                {navItems.map((item) => (
                    <SidebarNavItem key={item.label} href={item.href} icon={item.icon}>
                        <span className="sr-only">{item.label}</span>
                    </SidebarNavItem>
                ))}
            </nav>
        </aside>
    );
}
