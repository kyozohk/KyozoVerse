import Link from 'next/link';
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/enhanced-sidebar';
import { SidebarText } from '@/components/ui/sidebar-text';
import React from 'react';

interface SidebarNavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  isCollapsed?: boolean;
  section: string;
}

export const SidebarNavItem: React.FC<SidebarNavItemProps> = ({ 
  href, 
  icon: Icon, 
  label, 
  isActive, 
  isCollapsed, 
  section 
}) => {

  const sectionClasses = {
    communities: {
      active: 'border-primary text-primary',
      hover: 'hover:text-primary'
    },
    analytics: {
      active: 'border-analytics text-analytics',
      hover: 'hover:text-analytics'
    },
    subscription: {
      active: 'border-subscription text-subscription',
      hover: 'hover:text-subscription'
    },
    settings: {
      active: 'border-settings text-settings',
      hover: 'hover:text-settings'
    },
  };

  // @ts-ignore
  const classes = sectionClasses[section] || sectionClasses.communities;

  return (
    <SidebarMenuItem>
        <Link href={href} passHref>
            <SidebarMenuButton 
                isActive={isActive} 
                tooltip={label}
                className={`group text-white hover:bg-accent/50 ${isCollapsed ? 'justify-center' : ''} ${
                    isActive ? `bg-accent ${classes.active}` : ''
                }`}
            >
                <Icon className={`h-5 w-5 text-white group-hover:text-primary ${classes.hover} ${isActive ? `text-primary ${classes.active}` : ''}`} style={{ filter: 'drop-shadow(0px 0px 1px rgba(0,0,0,0.5))' }} />
                <SidebarText className={`text-base ${isCollapsed ? 'hidden' : 'block'}`}>{label}</SidebarText>
            </SidebarMenuButton>
        </Link>
    </SidebarMenuItem>
  );
};
