import Link from 'next/link';
import {
  Bell,
  BarChart,
  Users,
  Inbox,
  Rss,
  Ticket,
  Plug,
  LayoutDashboard
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

const communities = [
  { id: '1', name: 'Kyozo Demo', avatar: 'https://picsum.photos/seed/comm1/40/40' },
  { id: '2', name: 'AI Innovators', avatar: 'https://picsum.photos/seed/comm2/40/40' },
  { id: '3', name: 'Fashion Forward', avatar: 'https://picsum.photos/seed/comm3/40/40' },
];

const communityNavItems = [
    { href: '#', icon: LayoutDashboard, label: 'Overview' },
    { href: '#', icon: Users, label: 'Members' },
    { href: '#', icon: Bell, label: 'Broadcast' },
    { href: '#', icon: Inbox, label: 'Inbox' },
    { href: '#', icon: Rss, label: 'Feed' },
    { href: '#', icon: Ticket, label: 'Ticketing' },
    { href: '#', icon: Plug, label: 'Integrations' },
    { href: '#', icon: BarChart, label: 'Analytics' },
];

export default function CommunitySidebar() {
  return (
    <div className="hidden border-r bg-card lg:block w-72 ml-20">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Select defaultValue="1">
            <SelectTrigger className="w-full">
                <div className="flex items-center gap-3">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={communities[0].avatar} alt={communities[0].name} />
                        <AvatarFallback>KD</AvatarFallback>
                    </Avatar>
                    <SelectValue />
                </div>
            </SelectTrigger>
            <SelectContent>
              {communities.map((community) => (
                <SelectItem key={community.id} value={community.id}>
                  <div className="flex items-center gap-3">
                     <Avatar className="h-6 w-6">
                        <AvatarImage src={community.avatar} alt={community.name} />
                        <AvatarFallback>{community.name.substring(0,2)}</AvatarFallback>
                    </Avatar>
                    <span>{community.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {communityNavItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
