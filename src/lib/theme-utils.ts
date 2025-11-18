
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
    overview: { active: '#6D28D9', bg: 'rgba(109, 40, 217, 0.1)' },    // Violet
    members: { active: '#2563EB', bg: 'rgba(37, 99, 235, 0.1)' },      // Blue
    broadcast: { active: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },   // Amber
    inbox: { active: '#DC2626', bg: 'rgba(220, 38, 38, 0.1)' },        // Red
    feed: { active: '#16A34A', bg: 'rgba(22, 163, 74, 0.1)' },        // Green
    ticketing: { active: '#475569', bg: 'rgba(71, 85, 105, 0.1)' },    // Slate
    integrations: { active: '#0891B2', bg: 'rgba(8, 145, 178, 0.1)' },   // Cyan
    analytics: { active: '#4F46E5', bg: 'rgba(79, 70, 229, 0.1)' },    // Indigo
    communities: { active: '#843484', bg: 'rgba(132, 52, 132, 0.1)' },   // Default Purple
    subscription: { active: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },// Amber
    settings: { active: '#0891B2', bg: 'rgba(8, 145, 178, 0.1)' },     // Cyan
    default: { active: '#843484', bg: 'rgba(132, 52, 132, 0.1)' }      // Default Purple
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
