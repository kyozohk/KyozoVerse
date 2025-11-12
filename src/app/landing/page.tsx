import React from 'react';
import { Hero } from '@/components/landing/hero';

export default function LandingPage() {
  return (
    <main className="py-24 px-4 md:py-32" style={{ backgroundColor: 'rgba(0, 0, 0, 0.08)' }}>
      <Hero />
      {/* Add more landing page sections here */}
    </main>
  );
}
