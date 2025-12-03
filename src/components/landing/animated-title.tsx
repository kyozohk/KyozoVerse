
'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedTitleProps {
  text: string;
  subtitle?: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const AnimatedTitle: React.FC<AnimatedTitleProps> = ({ 
  text,
  subtitle,
  className = '',
  size = 'medium'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const words = text.split(' ');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const sizeClasses = {
    small: 'text-3xl md:text-4xl',
    medium: 'text-5xl md:text-6xl',
    large: 'text-7xl md:text-8xl',
  };
  
  const subtitleSizeClasses = {
    small: 'text-lg',
    medium: 'text-xl',
    large: 'text-2xl',
  };

  return (
    <div className={cn("text-center py-16", className)}>
      <h1 className={cn("font-bold", sizeClasses[size])}>
        {words.map((word, wordIndex) => (
          <span key={wordIndex} className="inline-block mr-4 last:mr-0">
            {word.split('').map((letter, letterIndex) => (
              <span
                key={`${wordIndex}-${letterIndex}`}
                className={cn(
                  "inline-block opacity-0 translate-y-10 transition-transform duration-500 ease-out",
                  isLoaded && "opacity-100 translate-y-0"
                )}
                style={{ transitionDelay: `${(wordIndex * 0.1 + letterIndex * 0.03)}s` }}
              >
                {letter === ' ' ? '\u00A0' : letter}
              </span>
            ))}
          </span>
        ))}
      </h1>
      {subtitle && (
        <p className={cn(
          "mt-4 text-muted-foreground opacity-0 translate-y-5 transition-all duration-500 ease-out",
          subtitleSizeClasses[size],
          isLoaded && "opacity-100 translate-y-0"
        )} style={{ transitionDelay: '0.5s' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default AnimatedTitle;
