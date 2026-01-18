
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
  RightComponent: React.ReactNode;
  className?: string;
  reverse?: boolean;
}

export function FeatureCard({
  title,
  description,
  buttonText,
  buttonAction,
  RightComponent,
  className,
  reverse = false,
}: FeatureCardProps) {
  
  return (
    <div
      className={cn(
        "relative flex flex-col md:flex-row rounded-2xl overflow-hidden shadow-lg w-full min-h-[600px] md:h-[600px] bg-background",
        reverse ? "md:flex-row-reverse" : "md:flex-row",
        className
      )}
    >
      {/* Content */}
      <div className={cn("relative z-10 flex flex-col md:flex-row flex-grow w-full h-full")}>
        {/* Left content */}
       <div className="flex flex-col p-8 md:p-12 lg:p-16 w-full md:w-[45%] justify-center h-auto md:h-full order-2 md:order-1">
          <h2
            className="text-5xl md:text-6xl mb-4 text-left leading-tight text-foreground"
            style={{
              fontFamily: '"Playfair Display", "Gloock", serif',
              textAlign: 'left',
              lineHeight: '1',
            }}
          >
            {title}
          </h2>

          <p
            className="text-base md:text-lg font-light mb-8 text-muted-foreground"
            style={{ textAlign: 'left' }}
          >
            {description}
          </p>

          <div className="mt-auto flex justify-start">
            <CustomButton
              onClick={buttonAction}
              variant="outline"
              className="border-2 hover:bg-muted"
              style={{
                backdropFilter: 'blur(10px)',
              }}
            >
              {buttonText}
            </CustomButton>
          </div>
        </div>

        
        {/* Right component */}
        <div className="relative w-full md:w-[55%] h-64 md:h-full flex items-center justify-center overflow-hidden flex-grow order-1 md:order-2 p-4 md:p-0">
          {RightComponent}
        </div>
      </div>
    </div>
  );
}

export default FeatureCard;
