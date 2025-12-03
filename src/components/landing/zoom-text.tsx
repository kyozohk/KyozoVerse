
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ZoomTextProps {
  text: string;
  fontSize?: string;
  fontWeight?: number;
  duration?: string;
  delay?: string;
}

const ZoomText: React.FC<ZoomTextProps> = ({
  text,
  fontSize,
  fontWeight,
  duration,
  delay
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(ref.current!);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <h2
      ref={ref}
      className={cn(
        "text-center font-bold transition-all ease-out",
        isVisible ? "scale-100 opacity-100" : "scale-90 opacity-0"
      )}
      style={{
        fontSize,
        fontWeight,
        transitionDuration: duration,
        transitionDelay: delay
      }}
    >
      {text}
    </h2>
  );
};

export default ZoomText;
