'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  CreditCard, 
  Settings, 
  LayoutGrid
} from 'lucide-react';

// This is a placeholder component to resolve import errors
// It redirects to the enhanced-sidebar component
export default function MainSidebar() {
  const pathname = usePathname();
  
  // Define navigation items
  const navItems = [
    { href: '/communities', icon: LayoutGrid, label: 'Communities', section: 'communities' },
    { href: '/analytics', icon: BarChart3, label: 'Analytics', section: 'analytics' },
    { href: '/subscription', icon: CreditCard, label: 'Subscription', section: 'subscription' },
    { href: '/account', icon: Settings, label: 'Settings', section: 'settings' },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-20 flex-col border-r bg-card sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 py-4">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors md:h-8 md:w-8 ${
              pathname.startsWith(item.href) ? 'text-[#843484]' : 'text-muted-foreground hover:text-[#843484]'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="sr-only">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
