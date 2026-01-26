'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { RoundImage } from './round-image';
import { CSSProperties, ReactNode } from 'react';

export interface BannerCTA {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
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
}

export function Banner({
  backgroundImage,
  iconImage,
  iconSize = 80,
  title,
  location,
  locationExtra,
  subtitle,
  tags = [],
  ctas = [],
  leftCta,
  height = '20rem',
  className,
}: BannerProps) {
  const bannerStyle: CSSProperties = {
    height,
  };

  return (
    <div 
      className={cn("relative w-full overflow-hidden rounded-t-2xl", className)}
      style={bannerStyle}
    >
      {/* Background Image */}
      {backgroundImage ? (
        <div className="absolute inset-0" style={{ backgroundColor: '#E2D9C9' }}>
          <Image
            src={backgroundImage}
            alt={title}
            fill
            className="object-cover"
            priority
          />
        </div>
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: '#E2D9C9' }} />
      )}
      
      {/* Dark overlay for better text visibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20" />
      
      {/* Top-left: Icon, Title, Location, Subtitle */}
      <div className="absolute top-8 left-8 flex items-start gap-4">
        {iconImage && (
          <RoundImage 
            src={iconImage} 
            alt={title} 
            size={iconSize}
            border={true}
            borderColor="rgba(255,255,255,0.5)"
            className="border-2 border-white/50"
          />
        )}
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-white drop-shadow-lg">{title}</h1>
          {(location || locationExtra) && (
            <div className="flex items-center gap-3 mt-1">
              {location && (
                <span className="text-sm text-white/90">📍 {location}</span>
              )}
              {locationExtra}
            </div>
          )}
          {subtitle && (
            <p className="text-sm text-white/80 mt-2 max-w-md">{subtitle}</p>
          )}
        </div>
      </div>
      
      {/* Bottom-left: Left CTA or Tags */}
      {leftCta ? (
        <div className="absolute bottom-8 left-8">
          <button
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 transition-all border-2 bg-transparent hover:bg-[#E8DFD1] hover:border-[#E8DFD1]"
            style={{ borderColor: '#E8DFD1', color: '#E8DFD1' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#5B4A3A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#E8DFD1';
            }}
            onClick={leftCta.onClick}
          >
            {leftCta.icon}
            {leftCta.label}
          </button>
        </div>
      ) : tags.length > 0 ? (
        <div className="absolute bottom-8 left-8 flex flex-wrap gap-2 max-w-md">
          {tags.map((tag) => (
            <span 
              key={tag} 
              className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold"
              style={{ backgroundColor: '#E8DFD1', color: '#5B4A3A' }}
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      
      {/* Bottom-right: CTA Buttons */}
      {ctas.length > 0 && (
        <div className="absolute bottom-8 right-8 flex items-center gap-3">
          {ctas.map((cta, index) => (
            <button
              key={index}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 transition-all border-2 bg-transparent hover:bg-[#E8DFD1] hover:border-[#E8DFD1]"
              style={{ borderColor: '#E8DFD1', color: '#E8DFD1' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#5B4A3A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#E8DFD1';
              }}
              onClick={cta.onClick}
            >
              {cta.icon}
              {cta.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Backward compatibility alias
export const CommunityBanner = Banner;
export type CommunityBannerProps = BannerProps;
