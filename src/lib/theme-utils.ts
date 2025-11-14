
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
    { href: (handle: string) => `/${handle}/dashboard`, icon: LayoutDashboard, label: 'Dashboard', section: 'overview' },
    { href: (handle: string) => `/${handle}/members`, icon: Users, label: 'Members', section: 'members' },
    { href: (handle: string) => `/${handle}/broadcast`, icon: Bell, label: 'Broadcast', section: 'broadcast' },
    { href: (handle: string) => `/${handle}/inbox`, icon: Inbox, label: 'Inbox', section: 'inbox' },
    { href: (handle: string) => `/${handle}/ticketing`, icon: Ticket, label: 'Ticketing', section: 'ticketing' },
    { href: (handle: string) => `/${handle}/integrations`, icon: Plug, label: 'Integrations', section: 'integrations' },
    { href: (handle: string) => `/${handle}/analytics`, icon: BarChart, label: 'Analytics', section: 'analytics' },
];

const themeColors: Record<string, { active: string; bg: string }> = {
    overview: { active: '#C170CF', bg: 'rgba(193, 112, 207, 0.3)' },
    members: { active: '#06C4B5', bg: 'rgba(6, 196, 181, 0.3)' },
    broadcast: { active: '#E1B327', bg: 'rgba(225, 179, 39, 0.3)' },
    inbox: { active: '#CF7770', bg: 'rgba(207, 119, 112, 0.3)' },
    feed: { active: '#699FE5', bg: 'rgba(105, 159, 229, 0.3)' },
    ticketing: { active: '#8EBE9B', bg: 'rgba(142, 190, 155, 0.3)' },
    integrations: { active: '#8EA1BE', bg: 'rgba(142, 161, 190, 0.3)' },
    analytics: { active: '#675263', bg: 'rgba(103, 82, 99, 0.3)' },
    communities: { active: '#843484', bg: 'rgba(132, 52, 132, 0.3)' },
    subscription: { active: '#E1B327', bg: 'rgba(225, 179, 39, 0.3)' },
    settings: { active: '#06C4B5', bg: 'rgba(6, 196, 181, 0.3)' },
    default: { active: '#843484', bg: 'rgba(132, 52, 132, 0.3)' }
};

export const getThemeForPath = (path: string) => {
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
