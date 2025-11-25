
import { 
  LayoutGrid, 
  BarChart, 
  CreditCard, 
  Settings, 
  LayoutDashboard, 
  Users, 
  Bell, 
  Inbox, 
  Rss, 
  Ticket, 
  Plug 
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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
    { href: '/analytics', icon: BarChart, label: 'Analytics', section: 'analytics' },
    { href: '/subscription', icon: CreditCard, label: 'Subscription', section: 'subscription' },
    { href: '/settings', icon: Settings, label: 'Settings', section: 'settings' },
];

export const communityNavItems: CommunityNavItem[] = [
    { href: (handle: string) => `/${handle}`, icon: LayoutDashboard, label: 'Overview', section: 'overview' },
    { href: (handle: string) => `/${handle}/members`, icon: Users, label: 'Members', section: 'members' },
    { href: (handle: string) => `/${handle}/broadcast`, icon: Bell, label: 'Broadcast', section: 'broadcast' },
    { href: (handle: string) => `/${handle}/inbox`, icon: Inbox, label: 'Inbox', section: 'inbox' },
    { href: (handle: string) => `/${handle}/feed`, icon: Rss, label: 'Feed', section: 'feed' },
    { href: (handle: string) => `/${handle}/ticketing`, icon: Ticket, label: 'Ticketing', section: 'ticketing' },
    { href: (handle: string) => `/${handle}/integrations`, icon: Plug, label: 'Integrations', section: 'integrations' },
    { href: (handle: string) => `/${handle}/analytics`, icon: BarChart, label: 'Analytics', section: 'analytics' },
];

const themeColors: Record<string, { active: string; bg: string }> = {
    overview: { active: '#C170CF', bg: 'rgba(193, 112, 207, 0.3)' },
    members: { active: '#CF7770', bg: 'rgba(207, 119, 112, 0.3)' }, // Swapped with inbox
    broadcast: { active: '#E1B327', bg: 'rgba(225, 179, 39, 0.3)' },
    inbox: { active: '#06C4B5', bg: 'rgba(6, 196, 181, 0.3)' }, // Swapped with members
    feed: { active: '#699FE5', bg: 'rgba(105, 159, 229, 0.3)' },
    ticketing: { active: '#475569', bg: 'rgba(71, 85, 105, 0.1)' },
    integrations: { active: '#0891B2', bg: 'rgba(8, 145, 178, 0.1)' },
    analytics: { active: '#4F46E5', bg: 'rgba(79, 70, 229, 0.1)' },
    communities: { active: '#843484', bg: 'rgba(132, 52, 132, 0.1)' },
    subscription: { active: '#E1B327', bg: 'rgba(225, 179, 39, 0.1)' },
    settings: { active: '#06C4B5', bg: 'rgba(6, 196, 181, 0.1)' },
    default: { active: '#843484', bg: 'rgba(132, 52, 132, 0.1)' }
};

export const getThemeForPath = (path: string) => {
    if (!path) {
        return {
            section: 'default',
            activeColor: themeColors.default.active,
            activeBgColor: themeColors.default.bg,
        };
    }
    const segments = path.split('/').filter(Boolean);

    let section = 'default';

    if (segments.length === 0) { // Root path "/"
        section = 'communities';
    } else if (mainNavItems.some(item => segments[0] === item.href.slice(1))) {
        // Main sections like /communities, /analytics
        const mainNavItem = mainNavItems.find(item => segments[0] === item.href.slice(1));
        section = mainNavItem?.section || 'default';
    } else if (segments.length >= 1) {
        // Community pages like /[handle] or /[handle]/members
        const subRoute = segments[1];
        const communityNavItem = communityNavItems.find(item => {
            const itemPath = item.href('handle').split('/')[2];
            return itemPath === subRoute;
        });

        if (communityNavItem) {
            section = communityNavItem.section;
        } else if (segments.length === 1) {
            // This is the overview page for a community handle
            section = 'overview';
        }
    }
    
    const theme = themeColors[section] || themeColors.default;

    return {
        section,
        activeColor: theme.active,
        activeBgColor: theme.bg,
    };
};
