
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { CustomButton } from "../ui";
import ZoomText from './zoom-text';
import { cn } from '@/lib/utils';

interface BottomTextProps {
  text?: string;
  fontSize?: string;
  fontWeight?: number;
}

const BottomText: React.FC<BottomTextProps> = ({
  text = 'Join the Kyozo creative universe',
  fontSize = '6rem',
  fontWeight = 700
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[80vh] w-full overflow-hidden p-8 pb-24">
      {/* Shapes Container */}
      <div className="absolute bottom-0 w-full flex justify-between items-end z-10 pointer-events-none">
        <div className="relative w-1/5 h-[20vh]">
          <Image 
            src="/bottom-left.png" 
            alt="Left decoration" 
            width={200}
            height={200}
            className={cn("transition-opacity duration-1000", isLoaded ? "opacity-100" : "opacity-0")}
            style={{ objectFit: 'contain', objectPosition: 'left bottom' }} 
          />
        </div>
        <div className="relative w-1/5 h-[20vh]">
          <Image 
            src="/bottom-right.png" 
            alt="Right decoration" 
            width={200}
            height={200}
            className={cn("transition-opacity duration-1000", isLoaded ? "opacity-100" : "opacity-0")}
            style={{ objectFit: 'contain', objectPosition: 'right bottom' }} 
          />
        </div>
      </div>
      
      {/* Main text */}
      <div className="my-8 z-20">
        <ZoomText 
          text={text}
          fontSize={fontSize}
          fontWeight={fontWeight}
          duration="500ms"
          delay="300ms"
        />
      </div>
      
      {/* Button */}
      <div className={cn(
        "mt-4 mb-16 z-20 transition-all duration-500",
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      )} style={{ transitionDelay: '0.5s' }}>
        <CustomButton variant="outline" size="large">
          Join the waitlist
        </CustomButton>
      </div>
      
      {/* Copyright */}
      <div className={cn(
        "w-full mt-16 text-center text-sm z-20 text-foreground transition-opacity duration-500",
        isLoaded ? "opacity-100" : "opacity-0"
      )} style={{ transitionDelay: '0.7s' }}>
        Copyright © {new Date().getFullYear()} Kyozo. All rights reserved.
      </div>
    </div>
  );
};

export default BottomText;
