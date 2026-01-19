import { 
  LayoutGrid, 
  BarChart, 
  CreditCard, 
  Settings, 
  Users, 
  Inbox, 
  Rss, 
  Plug,
  UserCheck,
  Calendar,
  Send,
  Ticket
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
    { href: '/waitlist', icon: UserCheck, label: 'Wait List', section: 'waitlist' },
    { href: '/analytics', icon: BarChart, label: 'Analytics', section: 'analytics' },
    { href: '/subscription', icon: CreditCard, label: 'Subscription', section: 'subscription' },
    { href: '/settings', icon: Settings, label: 'Settings', section: 'settings' },
];

export const communityNavItems: CommunityNavItem[] = [
    { href: (handle: string) => `/${handle}`, icon: LayoutGrid, label: 'Overview', section: 'overview' },
    { href: (handle: string) => `/${handle}/members`, icon: Users, label: 'Audience', section: 'audience' },
    { href: (handle: string) => `/${handle}/broadcast`, icon: Send, label: 'Broadcast', section: 'broadcast' },
    { href: (handle: string) => `/${handle}/ticketing`, icon: Ticket, label: 'RSVP & Guestlists', section: 'ticketing' },
    { href: (handle: string) => `/${handle}/schedule`, icon: Calendar, label: 'Schedule', section: 'schedule' },
    { href: (handle: string) => `/${handle}/inbox`, icon: Inbox, label: 'Inbox', section: 'inbox' },
    { href: (handle: string) => `/${handle}/feed`, icon: Rss, label: 'Feed', section: 'feed' },
    { href: (handle: string) => `/${handle}/integrations`, icon: Plug, label: 'Integrations', section: 'integrations' },
];

/**
 * Returns a single, unified theme based on CSS variables.
 */
export const getThemeForPath = (path: string) => {
    return {
        section: 'default',
        activeColor: 'hsl(var(--accent-foreground))',
        activeBgColor: 'hsl(var(--accent))',
    };
};
