
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
  Plug 
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
    { href: '/analytics', icon: BarChart, label: 'Analytics', section: 'analytics' },
    { href: '/subscription', icon: CreditCard, label: 'Subscription', section: 'subscription' },
    { href: '/settings', icon: Settings, label: 'Settings', section: 'settings' },
];

export const communityNavItems: CommunityNavItem[] = [
    { href: (handle: string) => `/communities/${handle}`, icon: LayoutDashboard, label: 'Overview', section: 'overview' },
    { href: (handle: string) => `/communities/${handle}/members`, icon: Users, label: 'Members', section: 'members' },
    { href: (handle: string) => `/communities/${handle}/broadcast`, icon: Megaphone, label: 'Broadcast', section: 'broadcast' },
    { href: (handle: string) => `/communities/${handle}/inbox`, icon: Inbox, label: 'Inbox', section: 'inbox' },
    { href: (handle: string) => `/communities/${handle}/feed`, icon: Rss, label: 'Feed', section: 'feed' },
    { href: (handle: string) => `/communities/${handle}/ticketing`, icon: Ticket, label: 'Ticketing', section: 'ticketing' },
    { href: (handle: string) => `/communities/${handle}/integrations`, icon: Plug, label: 'Integrations', section: 'integrations' },
    { href: (handle: string) => `/communities/${handle}/analytics`, icon: BarChart, label: 'Analytics', section: 'analytics' },
];

// Map sections to centralized theme colors
const themeColors: Record<string, { active: string; bg: string }> = {
    overview: { active: THEME_COLORS.overview.borderSolid, bg: THEME_COLORS.overview.bg },
    members: { active: THEME_COLORS.members.borderSolid, bg: THEME_COLORS.members.bg },
    broadcast: { active: THEME_COLORS.broadcast.borderSolid, bg: THEME_COLORS.broadcast.bg },
    inbox: { active: THEME_COLORS.inbox.borderSolid, bg: THEME_COLORS.inbox.bg },
    feed: { active: THEME_COLORS.feed.borderSolid, bg: THEME_COLORS.feed.bg },
    ticketing: { active: 'var(--ticketing-color-active)', bg: 'var(--ticketing-color-border)' },
    integrations: { active: 'var(--integrations-color-active)', bg: 'var(--integrations-color-border)' },
    analytics: { active: 'var(--analytics-color-active)', bg: 'var(--analytics-color-border)' },
    communities: { active: 'var(--communities-color-active)', bg: 'var(--communities-color-border)' },
    subscription: { active: 'var(--subscription-color-active)', bg: 'var(--subscription-color-border)' },
    settings: { active: 'var(--settings-color-active)', bg: 'var(--settings-color-border)' },
    default: { active: 'var(--default-color-active)', bg: 'var(--default-color-border)' }
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
    } else if (segments[0] === 'pro' && segments.length >= 2) {
        // Main sections like /pro/communities, /pro/analytics
        const mainNavItem = mainNavItems.find(item => item.href === `/${segments[0]}/${segments[1]}`);
        section = mainNavItem?.section || 'default';
    } else if (segments[0] === 'communities' && segments.length >= 2) {
        // Community pages like /communities/[handle] or /communities/[handle]/members
        const subRoute = segments[2]; // members, broadcast, etc.
        const communityNavItem = communityNavItems.find(item => {
            const itemPath = item.href('handle').split('/')[2];
            return itemPath === subRoute;
        });

        if (communityNavItem) {
            section = communityNavItem.section;
        } else if (segments.length === 2) {
            // This is the overview page for a community handle (/communities/[handle])
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
