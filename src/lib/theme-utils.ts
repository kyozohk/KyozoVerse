
import { 
  LayoutGrid, 
  BarChart, 
  CreditCard, 
  Settings, 
  LayoutDashboard, 
  Users, 
  Megaphone, 
  Inbox, 
  Rss, 
  Ticket, 
  Plug,
  UserCheck
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { THEME_COLORS, type CategoryKey } from './theme-colors';

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  section: string;
}

interface CommunityNavItem {
    href: (handle: string) => string;
    icon: LucideIcon;
    label: string;
    section: string;
}

export const mainNavItems: NavItem[] = [
    { href: '/communities', icon: LayoutGrid, label: 'Communities', section: 'communities' },
    { href: '/waitlist', icon: UserCheck, label: 'Wait List', section: 'waitlist' },
    { href: '/analytics', icon: BarChart, label: 'Analytics', section: 'analytics' },
    { href: '/subscription', icon: CreditCard, label: 'Subscription', section: 'subscription' },
    { href: '/settings', icon: Settings, label: 'Settings', section: 'settings' },
];

export const communityNavItems: CommunityNavItem[] = [
    { href: (handle: string) => `/${handle}`, icon: LayoutDashboard, label: 'Overview', section: 'overview' },
    { href: (handle: string) => `/${handle}/members`, icon: Users, label: 'Members', section: 'members' },
    { href: (handle: string) => `/${handle}/broadcast`, icon: Megaphone, label: 'Broadcast', section: 'broadcast' },
    { href: (handle: string) => `/${handle}/inbox`, icon: Inbox, label: 'Inbox', section: 'inbox' },
    { href: (handle: string) => `/${handle}/feed`, icon: Rss, label: 'Feed', section: 'feed' },
    { href: (handle: string) => `/${handle}/ticketing`, icon: Ticket, label: 'Ticketing', section: 'ticketing' },
    { href: (handle: string) => `/${handle}/integrations`, icon: Plug, label: 'Integrations', section: 'integrations' },
    { href: (handle: string) => `/${handle}/analytics`, icon: BarChart, label: 'Analytics', section: 'analytics' },
];

export function getThemeForPath(pathname: string) {
    const pathSegments = pathname.split('/').filter(Boolean);

    // Check main nav items first
    if (pathSegments.length > 0) {
        const topLevelPath = `/${pathSegments[0]}`;
        const mainNavItem = mainNavItems.find(item => item.href === topLevelPath);
        if (mainNavItem) {
            const section = mainNavItem.section as CategoryKey;
            const theme = THEME_COLORS[section] || THEME_COLORS.communities;
            return {
                activeColor: theme.primary,
                activeBgColor: theme.bg,
            };
        }
    }
    
    // If not a main nav item, assume it's a community path
    if (pathSegments.length > 0) {
        const communitySubPath = pathSegments[1] || ''; // e.g., 'members', 'feed' or empty for overview
        
        const communityNavItem = communityNavItems.find(item => {
            const itemSubPath = item.href('handle').split('/')[2] || '';
            return itemSubPath === communitySubPath;
        });

        if (communityNavItem) {
            const section = communityNavItem.section as CategoryKey;
            const theme = THEME_COLORS[section] || THEME_COLORS.overview;
            return {
                activeColor: theme.primary,
                activeBgColor: theme.bg,
            };
        }
    }
    
    // Default theme
    const defaultTheme = THEME_COLORS.communities;
    return {
        activeColor: defaultTheme.primary,
        activeBgColor: defaultTheme.bg,
    };
}
