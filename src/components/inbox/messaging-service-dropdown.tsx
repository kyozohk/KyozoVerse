'use client';

import { Check, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MessagingService {
  value: string;
  label: string;
  icon: string;
}

interface MessagingServiceDropdownProps {
  value: string;
  onChange: (value: string) => void;
  activeColor: string;
}

const services: MessagingService[] = [
  { value: 'all', label: 'All Messages', icon: '✓' },
  { value: 'whatsapp', label: 'WhatsApp', icon: '📱' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'sms', label: 'SMS', icon: '💬' },
  { value: 'telegram', label: 'Telegram', icon: '✈️' },
  { value: 'app', label: 'In-App', icon: '📲' },
];

export function MessagingServiceDropdown({ value, onChange, activeColor }: MessagingServiceDropdownProps) {
  const selectedService = services.find(s => s.value === value) || services[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 bg-background text-foreground text-sm font-medium transition-all hover:shadow-md min-w-[180px] justify-between focus:outline-none"
          style={{ borderColor: activeColor }}
        >
          <span className="flex items-center gap-2">
            <span className="text-base">{selectedService.icon}</span>
            <span className="text-foreground">{selectedService.label}</span>
          </span>
          <ChevronDown 
            className="h-4 w-4 transition-transform"
            style={{ color: activeColor }}
          />
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end"
        className="w-[220px] rounded-xl shadow-2xl border-2 overflow-hidden bg-gray-800 text-white p-0"
        style={{ borderColor: activeColor }}
      >
        {services.map((service) => (
          <DropdownMenuItem
            key={service.value}
            onClick={() => onChange(service.value)}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700 focus:bg-gray-700 cursor-pointer text-white"
          >
            <span className="text-lg">{service.icon}</span>
            <span className="flex-1 font-medium">{service.label}</span>
            {value === service.value && (
              <Check className="h-5 w-5" style={{ color: activeColor }} />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
