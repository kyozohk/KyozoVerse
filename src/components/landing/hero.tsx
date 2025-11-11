"use client";

import React from 'react';
import { GradientText } from '@/components/ui/gradient-text';
import { CustomButton } from '@/components/ui/custom-button';
import { ArrowRight } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative w-full py-24 px-4 md:py-32 overflow-hidden bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h1 className="mb-8">
            <GradientText
              as="span"
              className="block text-5xl md:text-7xl lg:text-8xl font-bold leading-tight"
              style={{ fontFamily: 'var(--display-font)' }}
            >
              Discover your
            </GradientText>
            <GradientText
              as="span"
              className="block text-5xl md:text-7xl lg:text-8xl font-bold leading-tight"
              style={{ fontFamily: 'var(--display-font)' }}
            >
              creative universe
            </GradientText>
          </h1>
          
          <p className="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto mb-8">
            Connect with like-minded creators, share your work, and explore a universe of creative possibilities.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <CustomButton size="large" icon={ArrowRight}>
              Join Now
            </CustomButton>
            <CustomButton size="large" variant="outline">
              Learn More
            </CustomButton>
          </div>
        </div>
      </div>
    </section>
  );
}
