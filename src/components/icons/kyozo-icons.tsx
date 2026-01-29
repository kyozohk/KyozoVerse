import type { SVGProps } from 'react';

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

// Overview icon - grid layout
export function OverviewIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 33 33"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12.3 4.1H5.5C4.7 4.1 4.1 4.7 4.1 5.5V15C4.1 15.8 4.7 16.4 5.5 16.4H12.3C13.1 16.4 13.7 15.8 13.7 15V5.5C13.7 4.7 13.1 4.1 12.3 4.1Z" />
      <path d="M27.4 4.1H20.5C19.8 4.1 19.1 4.7 19.1 5.5V9.6C19.1 10.3 19.8 10.9 20.5 10.9H27.4C28.1 10.9 28.7 10.3 28.7 9.6V5.5C28.7 4.7 28.1 4.1 27.4 4.1Z" />
      <path d="M27.4 16.4H20.5C19.8 16.4 19.1 17 19.1 17.8V27.4C19.1 28.1 19.8 28.7 20.5 28.7H27.4C28.1 28.7 28.7 28.1 28.7 27.4V17.8C28.7 17 28.1 16.4 27.4 16.4Z" />
      <path d="M12.3 21.9H5.5C4.7 21.9 4.1 22.5 4.1 23.2V27.4C4.1 28.1 4.7 28.7 5.5 28.7H12.3C13.1 28.7 13.7 28.1 13.7 27.4V23.2C13.7 22.5 13.1 21.9 12.3 21.9Z" />
    </svg>
  );
}

// Audience icon - users
export function AudienceIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 33 33"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21.9 28.7V26C21.9 24.5 21.3 23.1 20.3 22.1C19.3 21.1 17.9 20.5 16.4 20.5H8.2C6.8 20.5 5.4 21.1 4.3 22.1C3.3 23.1 2.7 24.5 2.7 26V28.7" />
      <path d="M12.3 15C15.3 15 17.8 12.6 17.8 9.6C17.8 6.6 15.3 4.1 12.3 4.1C9.3 4.1 6.8 6.6 6.8 9.6C6.8 12.6 9.3 15 12.3 15Z" />
      <path d="M30.1 28.7V26C30.1 24.8 29.7 23.6 28.9 22.6C28.2 21.7 27.2 21 26 20.7" />
      <path d="M21.9 4.3C23.1 4.6 24.1 5.3 24.8 6.2C25.6 7.2 26 8.4 26 9.6C26 10.8 25.6 12 24.8 12.9C24.1 13.9 23.1 14.6 21.9 14.9" />
    </svg>
  );
}

// Broadcast icon - send
export function BroadcastIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 33 33"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M19.9 29.7C19.9 29.8 20 29.9 20.1 30C20.3 30.1 20.4 30.1 20.5 30.1C20.7 30.1 20.8 30 20.9 30C21 29.9 21.1 29.8 21.2 29.6L30.1 3.6C30.1 3.5 30.1 3.4 30.1 3.3C30 3.1 30 3 29.9 2.9C29.8 2.8 29.7 2.8 29.6 2.7C29.4 2.7 29.3 2.7 29.2 2.8L3.2 11.7C3.1 11.7 3 11.8 2.9 11.9C2.8 12 2.7 12.2 2.7 12.3C2.7 12.4 2.8 12.6 2.8 12.7C2.9 12.8 3 12.9 3.2 12.9L14 17.3C14.4 17.4 14.7 17.6 14.9 17.9C15.2 18.2 15.4 18.5 15.5 18.8L19.9 29.7Z" />
      <path d="M29.9 2.9L14.9 17.9" />
    </svg>
  );
}

// RSVP & Guestlists icon - clipboard list
export function GuestlistIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 33 33"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20.5 2.7H12.3C11.6 2.7 10.9 3.3 10.9 4.1V6.8C10.9 7.6 11.6 8.2 12.3 8.2H20.5C21.3 8.2 21.9 7.6 21.9 6.8V4.1C21.9 3.3 21.3 2.7 20.5 2.7Z" />
      <path d="M21.9 5.5H24.6C25.3 5.5 26 5.8 26.6 6.3C27.1 6.8 27.4 7.5 27.4 8.2V27.4C27.4 28.1 27.1 28.8 26.6 29.3C26 29.8 25.3 30.1 24.6 30.1H8.2C7.5 30.1 6.8 29.8 6.3 29.3C5.8 28.8 5.5 28.1 5.5 27.4V8.2C5.5 7.5 5.8 6.8 6.3 6.3C6.8 5.8 7.5 5.5 8.2 5.5H10.9" />
      <path d="M16.4 15H21.9" />
      <path d="M16.4 21.9H21.9" />
      <path d="M10.9 15H11" />
      <path d="M10.9 21.9H11" />
    </svg>
  );
}

// Schedule icon - calendar
export function ScheduleIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 33 33"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M10.9 2.7V8.2" />
      <path d="M21.9 2.7V8.2" />
      <path d="M26 5.5H6.8C5.3 5.5 4.1 6.7 4.1 8.2V27.4C4.1 28.9 5.3 30.1 6.8 30.1H26C27.5 30.1 28.7 28.9 28.7 27.4V8.2C28.7 6.7 27.5 5.5 26 5.5Z" />
      <path d="M4.1 13.7H28.7" />
    </svg>
  );
}

// Inbox icon - mail tray
export function InboxIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 33 33"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M30.1 16.4H21.9L19.1 20.5H13.7L10.9 16.4H2.7" />
      <path d="M7.5 7L2.7 16.4V24.6C2.7 25.3 3 26 3.5 26.6C4 27.1 4.7 27.4 5.5 27.4H27.4C28.1 27.4 28.8 27.1 29.3 26.6C29.8 26 30.1 25.3 30.1 24.6V16.4L25.4 7C25.1 6.5 24.8 6.1 24.4 5.9C23.9 5.6 23.4 5.5 22.9 5.5H9.9C9.4 5.5 8.9 5.6 8.5 5.9C8 6.1 7.7 6.5 7.5 7Z" />
    </svg>
  );
}

// Feed icon - rss/activity
export function FeedIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 33 33"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6.7 26.1C1.4 20.8 1.4 12 6.7 6.7" />
      <path d="M10.7 22.2C7.5 19 7.5 13.8 10.7 10.5" />
      <path d="M16.4 19.1C17.9 19.1 19.1 17.9 19.1 16.4C19.1 14.9 17.9 13.7 16.4 13.7C14.9 13.7 13.7 14.9 13.7 16.4C13.7 17.9 14.9 19.1 16.4 19.1Z" />
      <path d="M22.2 10.7C25.3 13.8 25.3 19 22.2 22.3" />
      <path d="M26.1 6.7C31.5 12 31.5 20.7 26.1 26" />
    </svg>
  );
}

// Ticketing icon - ticket
export function TicketingIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 33 33"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2.7 12.3C3.8 12.3 4.9 12.7 5.6 13.5C6.4 14.3 6.8 15.3 6.8 16.4C6.8 17.5 6.4 18.5 5.6 19.3C4.9 20.1 3.8 20.5 2.7 20.5V23.2C2.7 24 3 24.7 3.5 25.2C4 25.7 4.7 26 5.5 26H27.4C28.1 26 28.8 25.7 29.3 25.2C29.8 24.7 30.1 24 30.1 23.2V20.5C29 20.5 28 20.1 27.2 19.3C26.4 18.5 26 17.5 26 16.4C26 15.3 26.4 14.3 27.2 13.5C28 12.7 29 12.3 30.1 12.3V9.6C30.1 8.8 29.8 8.2 29.3 7.6C28.8 7.1 28.1 6.8 27.4 6.8H5.5C4.7 6.8 4 7.1 3.5 7.6C3 8.2 2.7 8.8 2.7 9.6V12.3Z" />
      <path d="M17.8 6.8V9.6" />
      <path d="M17.8 23.2V26" />
      <path d="M17.8 15V17.8" />
    </svg>
  );
}

// Integrations icon - bolt/lightning
export function IntegrationsIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 33 33"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 2L4 18H16L14 30L28 14H16L18 2Z" />
    </svg>
  );
}

// Analytics icon - bar chart
export function AnalyticsIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 33 33"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4.1 4.1V26C4.1 26.7 4.4 27.4 4.9 27.9C5.4 28.4 6.1 28.7 6.8 28.7H28.7" />
      <path d="M24.6 23.2V12.3" />
      <path d="M17.8 23.2V6.8" />
      <path d="M10.9 23.2V19.1" />
    </svg>
  );
}
