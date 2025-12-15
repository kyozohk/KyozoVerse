
"use client";

import React from 'react';
import ScrollRevealText from './scroll-reveal-text';

interface HeroProps {
  text: string[];
}

export function Hero({ text }: HeroProps) {
  return (
    <section className="relative w-full overflow-hidden mt-40 mb-60">
      <ScrollRevealText 
        textLines={text} 
        fontSize="clamp(3rem, 10vw, 8rem)"
        fontWeight={400}
        className="font-canicule"
      />
    </section>
  );
}
