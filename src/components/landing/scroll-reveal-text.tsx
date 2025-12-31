
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ScrollRevealTextProps {
  textLines: string[];
  fontSize?: string;
  fontWeight?: number;
  className?: string;
}

const ScrollRevealText: React.FC<ScrollRevealTextProps> = ({
  textLines,
  fontSize = '8rem',
  fontWeight = 800,
  className,
}) => {

  const gradientStyle: React.CSSProperties = {
    backgroundImage: 'linear-gradient(90deg, var(--gradient-start), var(--gradient-end))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    color: 'transparent',
  };

  return (
    <div className={cn("text-center py-16", className)}>
      <h1 
        className="font-bold text-transparent bg-clip-text" 
        style={{ fontSize, fontWeight, ...gradientStyle, lineHeight: '1.2' }}
      >
        {textLines.map((line, index) => (
          <span key={index} className="block">
            {line}
          </span>
        ))}
      </h1>
    </div>
  );
};

export default ScrollRevealText;
