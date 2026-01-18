
"use client";

import React from 'react';

interface HeroProps {
  text: string[];
}

export function Hero({ 
  text, 
}: HeroProps) {
  return (
    <section className="relative w-full overflow-hidden mt-40 mb-60">
      <h1
        className="text-6xl md:text-8xl font-serif font-medium tracking-tight text-center text-foreground"
        style={{
          lineHeight: 1.1,
          fontFamily: '"Playfair Display", "Gloock", serif',
        }}
      >
        {text.map((line, index) => (
          <span
            key={index}
            className="block"
          >
            {line}
          </span>
        ))}
      </h1>
    </section>
  );
}
