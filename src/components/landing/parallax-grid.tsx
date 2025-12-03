'use client';

import React from 'react';
import Image from 'next/image';

export const ParallaxGrid: React.FC = () => {
  return (
    <div className="relative w-full h-full grid grid-cols-2 auto-rows-fr gap-2 p-4">
      {/* Top left - Parallax1 */}
      <div className="relative rounded-lg overflow-hidden row-span-1">
        <Image
          src="/Parallax1.jpg"
          alt="Creative community 1"
          fill
          className="object-cover"
        />
      </div>

      {/* Top right - Parallax2 */}
      <div className="relative rounded-lg overflow-hidden row-span-1">
        <Image
          src="/Parallax2.jpg"
          alt="Creative community 2"
          fill
          className="object-cover"
        />
      </div>

      {/* Middle left - Parallax3 (taller) */}
      <div className="relative rounded-lg overflow-hidden row-span-2">
        <Image
          src="/Parallax3.jpg"
          alt="Creative community 3"
          fill
          className="object-cover"
        />
      </div>

      {/* Middle right - Parallax4 */}
      <div className="relative rounded-lg overflow-hidden row-span-2">
        <Image
          src="/Parallax4.jpg"
          alt="Creative community 4"
          fill
          className="object-cover"
        />
      </div>

      {/* Bottom left - Parallax5 */}
      <div className="relative rounded-lg overflow-hidden row-span-1">
        <Image
          src="/Parallax5.jpg"
          alt="Creative community 5"
          fill
          className="object-cover"
        />
      </div>

      {/* Bottom right - Parallax6 */}
      <div className="relative rounded-lg overflow-hidden row-span-1">
        <Image
          src="/Parallax6.png"
          alt="Creative community 6"
          fill
          className="object-cover"
        />
      </div>
    </div>
  );
};
