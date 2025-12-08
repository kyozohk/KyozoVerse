"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface GradientTextProps {
  children: React.ReactNode;
  as?: React.ElementType;
  className?: string;
  direction?: 'left-to-right' | 'right-to-left' | 'top-to-bottom' | 'bottom-to-top';
  style?: React.CSSProperties;
}

const GradientText = ({
  children,
  as: Component = 'span',
  className,
  direction = 'left-to-right',
  style,
}: GradientTextProps) => {
  // Map direction to actual CSS gradient direction
  const gradientDirections = {
    'left-to-right': 'to right',
    'right-to-left': 'to left',
    'top-to-bottom': 'to bottom',
    'bottom-to-top': 'to top',
  };

  const gradientDirection = gradientDirections[direction];
  
  return (
    <Component
      className={cn('gradient-text', className)}
      style={{
        background: `linear-gradient(${gradientDirection}, var(--gradient-start), var(--gradient-end))`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        color: 'transparent', // Fallback for browsers that don't support background-clip: text
        display: 'inline-block',
        ...style,
      }}
    >
      {children}
    </Component>
  );
};

export { GradientText };
