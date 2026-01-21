
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
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-20 flex-col border-r bg-sidebar sm:flex sidebar-bg-default">
            <div className="flex h-full flex-col">
                <div className="flex h-[88px] items-center justify-center border-b" style={{ borderColor: 'var(--default-color-border)' }}>
                    <div className="flex items-center justify-center">
                        <Image src="/logo-icon.svg" alt="Kyozo" width={48} height={48} />
                    </div>
                </div>
                
                <nav className="flex flex-col items-center py-2">
                    {navItems.map((item) => (
                        <SidebarNavItem 
                            key={item.label} 
                            href={item.href} 
                            icon={item.icon}
                            className="w-full justify-center my-1"
                        >
                            <span className="sr-only">{item.label}</span>
                        </SidebarNavItem>
                    ))}
                </nav>
            </div>
        </aside>
    );
}
