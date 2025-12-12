
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Play, Lock } from 'lucide-react';

interface ListenCardProps {
  category: string;
  episode: string;
  duration: string;
  title: string;
  summary?: string;
  isPrivate?: boolean;
}

// Waveform component
const Waveform = () => {
    const [heights, setHeights] = useState<number[]>([]);
    const barCount = 80;

    useEffect(() => {
        const generateHeights = () => {
            return Array.from({ length: barCount }, () => 40 + Math.random() * 60);
        };
        setHeights(generateHeights());
    }, []);

    return (
        <div className="flex items-center gap-[2px] h-16 md:h-20 lg:h-24 cursor-pointer">
            {heights.map((height, index) => (
                <div
                    key={index}
                    className="flex-1 transition-all duration-75"
                    style={{
                        height: `${height}%`,
                        backgroundColor: index < 1 ? 'rgb(255, 176, 136)' : 'rgb(209, 213, 219)',
                        minWidth: '2px',
                        borderRadius: '2px'
                    }}
                />
            ))}
        </div>
    );
};

export function ListenCard({ category, episode, duration, title, summary, isPrivate }: ListenCardProps) {
  const cardStyle = {
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.1'/%3E%3C/svg%3E\")",
    backgroundColor: 'rgb(245, 241, 232)'
  };
  const innerDivStyle = {
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E\")"
  };
  return (
    <div className="bg-white overflow-hidden shadow-md border border-neutral-200 cursor-pointer relative group cursor-pointer transition-all duration-300 hover:shadow-xl ease-in-out hover:scale-[1.02]" style={cardStyle}>
      {isPrivate && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-red-500 rounded-full p-2 shadow-lg">
            <Lock className="w-4 h-4 text-white" />
          </div>
        </div>
      )}
      <div className="p-4 md:p-6 lg:p-8 h-full flex flex-col justify-between" style={innerDivStyle}>
        <div className="flex flex-col gap-3 md:gap-4 lg:gap-6">
          <div className="flex flex-col gap-2 md:gap-3 lg:gap-5">
            <div className="flex items-center gap-2 md:gap-2.5">
              <span className="px-2 py-1 md:px-2.5 md:py-1.5 text-[10px] md:text-xs uppercase tracking-wide bg-[rgb(29,130,168)] text-white rounded-full shadow-md opacity-50">
                {category}
              </span>
              <p className="text-neutral-500 uppercase tracking-[0.3px] text-[10px] md:text-xs leading-4">
                {episode} • {duration}
              </p>
            </div>
            <h2 className="text-[#4F5B66] leading-[1.1] text-2xl md:text-3xl lg:text-4xl" style={{ letterSpacing: '-1.5px', fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 600 }}>
              {title}
            </h2>
            {summary && <p className="text-[#504c4c] leading-relaxed text-sm md:text-base lg:text-lg">{summary}</p>}
          </div>
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center gap-3 md:gap-4">
              <button className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-[rgb(29,130,168)] hover:bg-[rgb(42,155,199)] flex items-center justify-center transition-all shadow-lg flex-shrink-0">
                <Play className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-white ml-1" />
              </button>
              <div className="flex-1">
                <Waveform />
                <div className="flex items-center justify-between mt-2 md:mt-3">
                  <span className="text-neutral-600 text-xs md:text-sm">0:00</span>
                  <span className="text-neutral-600 text-xs md:text-sm">0:00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
