
'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CustomButton } from './CustomButton';

interface FeatureCardProps {
  title: string;
  description: string;
  buttonText: string;
  buttonAction: () => void;
  color: string;
  RightComponent: React.ReactNode;
  className?: string;
  reverse?: boolean;
}

export function FeatureCard({
  title,
  description,
  buttonText,
  buttonAction,
  color,
  RightComponent,
  className,
  reverse = false,
}: FeatureCardProps) {
  
  const hexToRgba = (hex: string, alpha: number) => {
    if (!hex || !/^#[0-9A-F]{6}$/i.test(hex)) return 'rgba(0,0,0,0)';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  
  const overlayStyle = {
    backgroundColor: hexToRgba(color, 0.3)
  };

  const textStyle = {
    color: color
  };

  return (
    <div
      className={cn(
        "relative flex flex-col md:flex-row rounded-2xl overflow-hidden shadow-lg w-full",
        className
      )}
      style={{
        backgroundImage: `url('/bg/light_app_bg.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Color Overlay */}
      <div className="absolute inset-0 z-0" style={overlayStyle}></div>

      {/* Content */}
      <div className={cn("relative z-10 flex flex-col w-full", reverse ? "md:flex-row-reverse" : "md:flex-row")}>
        {/* Left content */}
        <div className="flex flex-col p-8 md:p-12 lg:p-16 w-full md:w-1/2 justify-center">
          <h2 className="text-5xl md:text-6xl mb-4" style={{...textStyle, fontFamily: '"Playfair Display", "Gloock", serif' }}>
            {title}
          </h2>
          <p className="text-lg text-white mb-8 max-w-md">{description}</p>
          <div className="mt-auto">
            <CustomButton
              onClick={buttonAction}
              variant="outline"
              className="bg-transparent border-2 hover:bg-white"
              style={{ borderColor: color, color: color }}
            >
              {buttonText}
            </CustomButton>
          </div>
        </div>
        
        {/* Right component */}
        <div className="relative w-full md:w-1/2 min-h-[400px] md:min-h-0 flex items-center justify-center">
          {RightComponent}
        </div>
      </div>
    </div>
  );
}

export default FeatureCard;
