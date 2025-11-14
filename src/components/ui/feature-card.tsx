'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonHref: string;
  className?: string;
  imageUrl?: string;
  color?: 'blue' | 'purple' | 'teal' | 'yellow' | 'red';
}

export function FeatureCard({
  title,
  subtitle,
  description,
  buttonText,
  buttonHref,
  className,
  imageUrl = '/Mobile-white.png',
  color = 'blue',
}: FeatureCardProps) {
  // Map color names to CSS variables from theme
  const colorMap = {
    blue: 'rgba(105, 159, 229, 0.5)', // feed color with 50% opacity
    purple: 'rgba(132, 52, 132, 0.5)', // communities color with 50% opacity
    teal: 'rgba(6, 196, 181, 0.5)', // settings color with 50% opacity
    yellow: 'rgba(225, 179, 39, 0.5)', // broadcast color with 50% opacity
    red: 'rgba(207, 119, 112, 0.5)', // inbox color with 50% opacity
  };

  const bgColor = colorMap[color];

  return (
    <div 
      className={cn(
        "relative flex flex-row rounded-2xl overflow-hidden shadow-lg",
        className
      )}
      style={{ backgroundColor: bgColor }}
    >
      {/* Left content */}
      <div className="flex flex-col p-8 w-3/5">
        <h2 className="text-4xl font-bold text-white mb-2">{title}</h2>
        <h3 className="text-2xl font-medium text-white mb-4">{subtitle}</h3>
        <p className="text-white/90 mb-8">{description}</p>
        <div className="mt-auto">
          <Link 
            href={buttonHref}
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-primary-purple font-medium rounded-full hover:bg-white/90 transition-colors"
          >
            {buttonText}
          </Link>
        </div>
      </div>
      
      {/* Right image */}
      <div className="relative w-2/5">
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src={imageUrl}
            alt="Feature illustration"
            width={300}
            height={600}
            className="object-contain h-full"
          />
        </div>
      </div>
    </div>
  );
}

export default FeatureCard;
