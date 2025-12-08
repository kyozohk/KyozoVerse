
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ScrollRevealTextProps {
  text: string[];
  fontSize?: string;
  fontWeight?: number;
  threshold?: number;
  revealSpeed?: number;
}

const ScrollRevealText: React.FC<ScrollRevealTextProps> = ({
  text,
  fontSize = '8rem',
  fontWeight = 800,
  threshold = 0.3,
  revealSpeed = 1.0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const lines = Array.isArray(text) ? text : [text];
  const words = lines.join(' \n ').split(' ');
  const totalLetters = words.reduce((acc, word) => acc + word.length, 0) + words.length - 1;

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const elementHeight = rect.height;
      const elementTop = rect.top;
      const elementBottom = rect.bottom;

      let visiblePercentage = 0;

      if (elementBottom <= 0) {
        visiblePercentage = 1;
      } else if (elementTop >= windowHeight) {
        visiblePercentage = 0;
      } else {
        const totalScrollDistance = windowHeight + elementHeight * 0.7;
        const scrolledDistance = windowHeight - elementTop;
        visiblePercentage = Math.min(Math.max(scrolledDistance / totalScrollDistance, 0), 1);
      }

      const scaledProgress = Math.min(visiblePercentage / 0.5, 1);
      const adjustedProgress = Math.pow(scaledProgress, 1 / revealSpeed);
      setScrollProgress(adjustedProgress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [revealSpeed]);

  const gradientStyle: React.CSSProperties = {
    backgroundImage: 'linear-gradient(90deg, #7c3aed, #4f46e5 35%, #0ea5e9 60%, #10b981 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    color: 'transparent',
  };

  return (
    <div ref={containerRef} className="relative flex items-center justify-center min-h-[80vh] w-full overflow-hidden z-5 p-8">
      <h1 className="text-center leading-tight m-0 p-0 text-transparent bg-clip-text" style={{ fontSize, fontWeight, ...gradientStyle }}>
        {lines.map((line, lineIndex) => (
          <React.Fragment key={lineIndex}>
            <span className="block">
              {line.split(' ').map((word, wordIndex) => (
                <span key={wordIndex} className="inline-block mr-2 last:mr-0">
                  {word.split('').map((letter, letterIndex) => {
                    const overallLetterIndex =
                      lines.slice(0, lineIndex).join(' ').length +
                      line.split(' ').slice(0, wordIndex).join(' ').length +
                      letterIndex +
                      lineIndex +
                      wordIndex;

                    const letterThreshold = overallLetterIndex / totalLetters;
                    const isRevealed = scrollProgress >= letterThreshold;
                    const transitionDelay = `${overallLetterIndex * 0.05}s`;

                    return (
                      <span
                        key={`${wordIndex}-${letterIndex}`}
                        className={cn(
                          "inline-block opacity-0 translate-y-10 transition-all duration-500 ease-in-out",
                          isRevealed && "opacity-100 translate-y-0"
                        )}
                        style={{ transitionDelay }}
                      >
                        {letter === ' ' ? '\u00A0' : letter}
                      </span>
                    );
                  })}
                </span>
              ))}
            </span>
          </React.Fragment>
        ))}
      </h1>
    </div>
  );
};

export default ScrollRevealText;
