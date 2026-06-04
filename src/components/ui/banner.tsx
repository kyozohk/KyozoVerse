'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { Trash2 } from 'lucide-react';

export interface BannerCTA {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

export interface BannerProps {
  backgroundImage?: string;
  iconImage?: string;
  iconSize?: number;
  title: string;
  location?: string;
  locationExtra?: ReactNode;
  subtitle?: string;
  tags?: string[];
  ctas?: BannerCTA[];
  leftCta?: BannerCTA;  // Single CTA for bottom-left (e.g., Back button)
  height?: string;
  className?: string;
  onDelete?: () => void;  // Optional delete handler for top-right delete button
}

export function Banner({
  title,
  subtitle,
  ctas = [],
  leftCta,
  className,
  onDelete,
}: BannerProps) {
  // Header is now minimal: title (left) + CTAs (right). All other props
  // (backgroundImage, iconImage, location, tags, height) are still
  // accepted for backward compatibility but no longer rendered.
  return (
    <div
      className={cn(
        'relative w-full flex items-center justify-between gap-4 px-8 py-6 border-b',
        className
      )}
      style={{ borderColor: '#E8DFD1' }}
    >
      {/* Left: optional back CTA + title */}
      <div className="flex items-center gap-4 min-w-0">
        {leftCta && (
          <button
            onClick={leftCta.onClick}
            disabled={leftCta.disabled}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-md text-sm font-medium border-2 transition-colors hover:bg-[#F0E8DA] disabled:opacity-50 disabled:pointer-events-none"
            style={{ borderColor: '#A89882', color: '#3D2E1F' }}
          >
            {leftCta.icon}
            {leftCta.label}
          </button>
        )}
        <div className="flex flex-col min-w-0">
          <h1 className="text-3xl font-bold tracking-tight truncate" style={{ color: '#3D2E1F' }}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm mt-1" style={{ color: '#6B5F52' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: CTAs + optional delete */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {ctas.map((cta, index) => (
          <button
            key={index}
            onClick={cta.onClick}
            disabled={cta.disabled}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-md text-sm font-medium border-2 transition-colors hover:bg-[#F0E8DA] disabled:opacity-50 disabled:pointer-events-none"
            style={{ borderColor: '#A89882', color: '#3D2E1F' }}
          >
            {cta.icon}
            {cta.label}
          </button>
        ))}
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-2 rounded-md text-red-600 hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Backward compatibility alias
export const CommunityBanner = Banner;
export type CommunityBannerProps = BannerProps;
