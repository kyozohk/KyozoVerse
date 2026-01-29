
import {
    LayoutGrid,
    BarChart3,
    CreditCard,
    Settings,
    Users,
    Bell,
    Inbox,
    Rss,
    Ticket,
    Plug,
    LayoutDashboard,
    Plus,
    Calendar,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { THEME_COLORS, type CategoryKey } from './theme-colors';


interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const mainNavItems: NavItem[] = [
    { href: '/communities', label: 'Communities', icon: LayoutGrid },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/subscription', label: 'Subscription', icon: CreditCard },
    { href: '/account', label: 'Settings', icon: Settings },
];

interface CommunityNavItem {
  href: (handle: string) => string;
  label: string;
  icon: LucideIcon;
  section: string;
}

export const communityNavItems: CommunityNavItem[] = [
    { href: (handle) => `/${handle}`, icon: LayoutDashboard, label: 'Overview', section: 'communities' },
    { href: (handle) => `/${handle}/audience`, icon: Users, label: 'Audience', section: 'communities' },
    { href: (handle) => `/${handle}/broadcast`, icon: Bell, label: 'Broadcast', section: 'communities' },
    { href: (handle) => `/${handle}/guestlist`, icon: Ticket, label: 'RSVP & Guestlist', section: 'communities' },
    { href: (handle) => `/${handle}/schedule`, icon: Calendar, label: 'Schedule', section: 'communities' },
    { href: (handle) => `/${handle}/inbox`, icon: Inbox, label: 'Inbox', section: 'communities' },
    { href: (handle) => `/${handle}/feed`, icon: Rss, label: 'Feed', section: 'communities' },    
    { href: (handle) => `/${handle}/integrations`, icon: Plug, label: 'Integrations', section: 'communities' },
    { href: (handle) => `/${handle}/settings`, icon: Settings, label: 'Settingss', section: 'communities' },
    { href: (handle) => `/${handle}/morefeatures`, icon: Plus, label: 'More Features', section: 'morefeatures' },
];

export const getThemeForPath = (pathname: string) => {
    const segments = pathname.split('/').filter(Boolean);
  
    if (segments.length === 0) { // Root path
      return {
        activeColor: THEME_COLORS.overview.primary,
        borderColor: THEME_COLORS.overview.border,
      };
    }
  
    const mainSegment = segments[0];
  
    // Check main navigation items first
    const mainNavItem = mainNavItems.find(item => item.href === `/${mainSegment}`);
    if (mainNavItem) {
      const key = mainNavItem.label.toLowerCase() as CategoryKey;
      const colors = THEME_COLORS[key] || THEME_COLORS.overview;
      return {
        activeColor: colors.primary,
        borderColor: colors.border,
      };
    }
    
    // Check community sub-pages
    if (segments.length > 1) {
      const subSegment = segments[1];
      const communityNavItem = communityNavItems.find(item => item.href('handle').endsWith(subSegment));
      if (communityNavItem) {
        const key = communityNavItem.section as CategoryKey;
        const colors = THEME_COLORS[key] || THEME_COLORS.overview;
        return {
          activeColor: colors.primary,
          borderColor: colors.border,
        };
      }
    }
  
    // Fallback for community root (e.g. /[handle])
    // If the path is /[something] and it's not a main nav item, assume it's a community page.
    if (segments.length === 1 && !mainNavItem) {
      const communityRootItem = communityNavItems.find(item => item.label === 'Overview');
      if (communityRootItem) {
          const key = communityRootItem.section as CategoryKey;
          const colors = THEME_COLORS[key] || THEME_COLORS.overview;
          return {
              activeColor: colors.primary,
              borderColor: colors.border,
          };
      }
    }
  
    // Default theme
    return {
      activeColor: THEME_COLORS.overview.primary,
      borderColor: THEME_COLORS.overview.border,
    };
  };

export const hexToRgba = (hex: string, alpha: number) => {
    if (!hex || !/^#[0-9A-F]{6}$/i.test(hex)) return 'rgba(0,0,0,0)';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
