
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import React from 'react';

const sidebarNavItemVariants = cva(
  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-base font-medium transition-all',
  {
    variants: {
      state: {
        default: 'text-[#6B6358] hover:bg-[#F5F1E8]', // Normal state from guide
        active: 'bg-[#E8DFD0] text-[#3A3630] font-bold shadow-sm', // Active state from guide
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
                default: 'text-[#6B6358] group-hover:text-[#3A3630]',
                active: 'text-[#3A3630]',
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
    let isActive = isActiveProp !== undefined ? isActiveProp : pathname === href;

    // Special case for root, only active if path is exactly '/'
    if (href === '/') {
        isActive = pathname === href;
    } else if (href !== '/') {
        isActive = pathname.startsWith(href);
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
              className: cn(iconVariants({ state: isActive ? 'active' : 'default' }), 'h-5 w-5')
          })}
          {children}
        </Link>
      </li>
    );
  }
);

SidebarNavItem.displayName = 'SidebarNavItem';

export { SidebarNavItem, sidebarNavItemVariants };
