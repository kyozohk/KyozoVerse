
'use client';

import React from 'react';
import Image from 'next/image';

interface IphoneMockupProps {
  src: string;
}

export const IphoneMockup: React.FC<IphoneMockupProps> = ({ src }) => {
  return (
    <div className="relative w-64 h-[32rem] pointer-events-none">
      <Image
        src={src}
        alt="App Mockup"
        fill
        className="object-contain"
      />
    </div>
  );
};
