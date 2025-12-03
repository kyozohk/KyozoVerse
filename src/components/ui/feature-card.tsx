
'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CustomButton } from './CustomButton';

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

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
  
  
  const overlayStyle = {
    backgroundColor: hexToRgba(color, 0.1)
  };

  const textStyle = {
    color: color
  };

  return (
    <div
      className={cn(
        "relative flex flex-col md:flex-row rounded-2xl overflow-hidden shadow-lg w-full h-[600px]",
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
      <div className={cn("relative z-10 flex flex-col w-full h-full", reverse ? "md:flex-row-reverse" : "md:flex-row")}>
        {/* Left content */}
       <div className="flex flex-col p-8 md:p-12 lg:p-16 w-full md:w-[45%] justify-center h-full">
  <h2
    className="text-6xl md:text-6xl mb-4 text-left leading-relaxed"
    style={{
      ...textStyle,
      fontFamily: '"Playfair Display", "Gloock", serif',
      textAlign: 'left',
    }}
  >
    {title}
  </h2>

  <p
    className="text-base md:text-lg font-light mb-8" // thinner + wider
    style={{ color: '#5A5A5A', textAlign: 'left' }}
  >
    {description}
  </p>

  <div className="mt-auto flex justify-start">
    <CustomButton
      onClick={buttonAction}
      variant="outline"
      className="border-2 hover:bg-white"
      style={{
        backgroundColor: hexToRgba(color, 0.2),
        borderColor: color,
        color: color,
        backdropFilter: 'blur(10px)',
      }}
    >
      {buttonText}
    </CustomButton>
  </div>
</div>

        
        {/* Right component */}
<div className="relative w-full md:w-[55%] h-full flex items-center justify-center overflow-hidden">
  {RightComponent}
</div>
      </div>
    </div>
  );
}

export default FeatureCard;
