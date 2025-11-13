
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import React from 'react';

const sidebarNavItemVariants = cva(
  'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors font-dm-sans',
  {
    variants: {
      state: {
        default: 'text-[#3B3B3B] hover:text-[var(--active-color)] hover:bg-[var(--active-color-bg)]',
        active: 'text-[var(--active-color)] bg-[var(--active-color-bg)]',
      },
    },
    defaultVariants: {
      state: 'default',
    },
  }
);

const iconVariants = cva(
    'h-5 w-5 transition-colors',
    {
        variants: {
            state: {
                default: 'text-[#3B3B3B] group-hover:text-[var(--active-color)]',
                active: 'text-[var(--active-color)]',
            }
        },
        defaultVariants: {
            state: 'default'
        }
    }
);

export interface SidebarNavItemProps extends React.HTMLAttributes<HTMLAnchorElement> {
    href: string;
    icon: React.ReactElement;
    children: React.ReactNode;
    activeColor?: string;
    activeBgColor?: string;
}

const SidebarNavItem = React.forwardRef<HTMLAnchorElement, SidebarNavItemProps>(
  ({ className, href, icon, children, activeColor = '#763182', activeBgColor = 'rgba(132, 52, 132, 0.1)', ...props }, ref) => {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
      <Link
        href={href}
        className={cn(sidebarNavItemVariants({ state: isActive ? 'active' : 'default' }), className)}
        style={{ 
            '--active-color': activeColor,
            '--active-color-bg': activeBgColor
        } as React.CSSProperties}
        ref={ref}
        {...props}
      >
        {React.cloneElement(icon, {
            className: cn(iconVariants({ state: isActive ? 'active' : 'default' }), 'font-light')
        })}
        {children}
      </Link>
    );
  }
);

SidebarNavItem.displayName = 'SidebarNavItem';

export { SidebarNavItem, sidebarNavItemVariants };
