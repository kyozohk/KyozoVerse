
"use client";

import React from 'react';

interface HeroProps {
  text: string[];
  gradientStart?: string;
  gradientEnd?: string;
}

export function Hero({ 
  text, 
  gradientStart = 'var(--gradient-start)', 
  gradientEnd = 'var(--gradient-end)' 
}: HeroProps) {
  return (
    <section className="relative w-full overflow-hidden mt-40 mb-60">
      <h1
        className="text-6xl md:text-8xl font-serif font-medium tracking-tight text-center"
        style={{
          lineHeight: 1.1,
          fontFamily: '"Playfair Display", "Gloock", serif',
        }}
      >
        {text.map((line, index) => (
          <span
            key={index}
            className="text-transparent bg-clip-text block"
            style={{
              backgroundImage: `linear-gradient(90deg, ${gradientStart}, ${gradientEnd})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {line}
          </span>
        ))}
      </h1>
    </section>
  );
}
