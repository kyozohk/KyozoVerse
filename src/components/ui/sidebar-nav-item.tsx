
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import React from 'react';

const sidebarNavItemVariants = cva(
  'group flex items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold transition-all group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2.5',
  {
    variants: {
      state: {
        default: 'text-[#6B6358] hover:bg-[#F5F1E8]',
        active: 'bg-[#E8DFD0] text-[#3A3630] shadow-sm',
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

    if (href === '/') {
        isActive = pathname === href;
    } else if (href !== '/') {
        isActive = pathname.startsWith(href);
    }
    
    // Remove custom props from being passed to the DOM element
    const { ...restProps } = props;


    return (
      <li className="list-none">
        <Link
          href={href}
          className={cn(sidebarNavItemVariants({ state: isActive ? 'active' : 'default' }), className)}
          ref={ref}
          {...restProps}
        >
          {React.cloneElement(icon, {
              className: cn(iconVariants({ state: isActive ? 'active' : 'default' }), 'h-6 w-6')
          })}
          <div className="group-data-[collapsible=icon]:hidden">{children}</div>
        </Link>
      </li>
    );
  }
);

SidebarNavItem.displayName = 'SidebarNavItem';

export { SidebarNavItem, sidebarNavItemVariants };
