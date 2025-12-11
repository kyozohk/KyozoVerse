
'use client';

import React from 'react';
import Image from 'next/image';
import { Play, Volume2, Heart, MessageCircle } from 'lucide-react';

interface WatchCardProps {
  category: string;
  title: string;
  imageUrl: string;
  imageHint: string;
}

export function WatchCard({ category, title, imageUrl, imageHint }: WatchCardProps) {
  const cardStyle = {
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.1'/%3E%3C/svg%3E\")",
    backgroundColor: 'rgb(245, 241, 232)'
  };

  return (
    <div className="relative bg-neutral-900 overflow-hidden shadow-md border border-neutral-200 group cursor-pointer transition-all duration-300 hover:shadow-xl ease-in-out hover:scale-[1.02]" style={cardStyle}>
      <Image src={imageUrl} alt={title} fill className="w-full h-full object-cover" data-ai-hint={imageHint} />
      <div className="absolute top-4 left-4 md:top-6 md:left-6">
        <span className="px-2 py-1 md:px-2.5 md:py-1.5 text-[10px] md:text-xs uppercase tracking-wide bg-[#FBBF24] text-neutral-900 rounded-full shadow-md opacity-50">
          {category}
        </span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 pt-12 pb-3 px-4 md:px-6">
        <h2 className="text-white leading-tight mb-4 drop-shadow-lg text-xl md:text-2xl" style={{ letterSpacing: '-0.5px', fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 600 }}>
          {title}
        </h2>
        {/* Player controls */}
        <div className="flex items-center gap-3 md:gap-4">
            <button className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#FBBF24]/70 hover:bg-[#F59E0B]/70 flex items-center justify-center transition-all flex-shrink-0 shadow-lg">
                <Play className="w-5 h-5 md:w-6 md:h-6 text-white ml-0.5" />
            </button>
            <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-white text-sm md:text-base font-medium drop-shadow-lg">0:38</span>
                <span className="text-white/80 text-sm md:text-base drop-shadow-lg">/</span>
                <span className="text-white/80 text-sm md:text-base drop-shadow-lg">3:01</span>
            </div>
            <div className="flex-1 h-1.5 bg-white/20 rounded-full cursor-pointer relative group/progress backdrop-blur-sm">
                <div className="h-full bg-[#FBBF24] rounded-full relative transition-all" style={{width: '21%'}}>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity"></div>
                </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                <button className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-white hover:text-white/80 transition-colors drop-shadow-lg">
                    <Volume2 className="w-5 h-5 md:w-5.5 md:h-5.5" />
                </button>
                <button className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-white hover:text-white/80 transition-colors drop-shadow-lg">
                    <Heart className="w-5 h-5 md:w-5.5 md:h-5.5 transition-all" />
                </button>
                <button className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-white hover:text-white/80 transition-colors drop-shadow-lg">
                    <MessageCircle className="w-5 h-5 md:w-5.5 md:h-5.5" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
