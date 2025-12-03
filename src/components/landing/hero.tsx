
"use client";

import React from 'react';

interface HeroProps {
  text: string[];
}

export function Hero({ text }: HeroProps) {
  return (
    <section className="relative w-full overflow-hidden">
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
              backgroundImage: 'linear-gradient(90deg, #7c3aed, #4f46e5 35%, #0ea5e9 60%, #10b981 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              MozBackgroundClip: 'text',
              MozTextFillColor: 'transparent',
            }}
          >
            {line}
          </span>
        ))}
      </h1>
    </section>
  );
}
