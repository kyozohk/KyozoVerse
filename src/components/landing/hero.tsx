"use client";

import React from 'react';
import { GradientText, CustomButton } from '@/components/ui';
import { ArrowRight } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative w-full py-24 px-4 md:py-32 overflow-hidden">
       <h1
          className="text-6xl md:text-8xl font-serif font-medium tracking-tight"
          style={{
            lineHeight: 1.1,
            fontFamily: '"Playfair Display", "Gloock", serif',
          }}
        >
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage:
                'linear-gradient(90deg, #7c3aed, #4f46e5 35%, #0ea5e9 60%, #10b981 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              MozBackgroundClip: 'text',
              MozTextFillColor: 'transparent',
            }}
          >
            Discover your
            <br />
            creative universe
          </span>
        </h1>
    </section>
  );
}
