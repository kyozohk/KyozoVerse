'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import React from 'react';

const sidebarNavItemVariants = cva(
  'group flex items-center gap-4 rounded-[10px] px-4 py-3 text-lg font-medium transition-colors',
  {
    variants: {
      state: {
        default: 'text-muted-foreground hover:text-accent-foreground hover:bg-accent',
        active: 'text-accent-foreground bg-accent',
      },
    },
    defaultVariants: {
      state: 'default',
    },
  }
);

const iconVariants = cva(
    'h-6 w-6 transition-colors',
    {
        variants: {
            state: {
                default: 'text-muted-foreground group-hover:text-accent-foreground',
                active: 'text-accent-foreground',
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
    isActive?: boolean;
}

const SidebarNavItem = React.forwardRef<HTMLAnchorElement, SidebarNavItemProps>(
  ({ className, href, icon, children, isActive: isActiveProp, ...props }, ref) => {
    const pathname = usePathname();
    const isActive = isActiveProp !== undefined ? isActiveProp : pathname.startsWith(href) && href !== '/';

    // Special case for root, only active if path is exactly '/'
    if (href === '/') {
        const isActive = pathname === href;
    }


    return (
      <li className="list-none">
        <Link
          href={href}
          className={cn(sidebarNavItemVariants({ state: isActive ? 'active' : 'default' }), className)}
          ref={ref}
          {...props}
        >
          {React.cloneElement(icon, {
              className: cn(iconVariants({ state: isActive ? 'active' : 'default' }), 'h-6 w-6')
          })}
          {children}
        </Link>
      </li>
    );
  }
);

SidebarNavItem.displayName = 'SidebarNavItem';

export { SidebarNavItem, sidebarNavItemVariants };
