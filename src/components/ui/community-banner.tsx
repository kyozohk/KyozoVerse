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

export interface CommunityBannerProps {
  backgroundImage?: string;
  iconImage?: string;
  iconSize?: number;
  title: string;
  location?: string;
  subtitle?: string;
  tags?: string[];
  ctas?: BannerCTA[];
  height?: string;
  className?: string;
}

export function CommunityBanner({
  backgroundImage,
  iconImage,
  iconSize = 80,
  title,
  location,
  subtitle,
  tags = [],
  ctas = [],
  height = '20rem',
  className,
}: CommunityBannerProps) {
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
          {location && (
            <p className="text-sm text-white/90 mt-1">📍 {location}</p>
          )}
          {subtitle && (
            <p className="text-sm text-white/80 mt-2 max-w-md">{subtitle}</p>
          )}
        </div>
      </div>
      
      {/* Bottom-left: Tags */}
      {tags.length > 0 && (
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
      )}
      
      {/* Top-right: CTA Buttons */}
      {ctas.length > 0 && (
        <div className="absolute top-8 right-8 flex items-center gap-3">
          {ctas.map((cta, index) => (
            <button
              key={index}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 transition-colors hover:opacity-90"
              style={{ backgroundColor: '#E8DFD1', color: '#5B4A3A' }}
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
