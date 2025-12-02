import React from 'react';
import { Hero } from '@/components/landing/hero';
import FeatureCard from '@/components/ui/feature-card';
import VideoWall from '@/components/landing/video-wall';

export default function LandingPage() {
  return (
    <main className="py-24 px-4 md:py-32" style={{ backgroundColor: 'rgba(0, 0, 0, 0.08)' }}>
      <Hero />
      <section className="mt-24">
        <FeatureCard
          title="Exclusive access and insights"
          description="Experience the creative world through an insider's lens. Kyozo is an eco-system of creative communities - that gives you exclusive access to updates and insights from the creative luminaries driving cultural evolution."
          buttonText="Join the waitlist"
          buttonHref="/request-access"
          color="#CC583F" // Example: A rustic orange color from the image
          RightComponent={<VideoWall />}
        />
      </section>
      {/* Add more landing page sections here */}
    </main>
  );
}
