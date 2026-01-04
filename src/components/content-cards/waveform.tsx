'use client';
import React, { useState, useEffect } from 'react';

interface WaveformProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  barCount?: number;
}

export const Waveform = ({ isPlaying, currentTime, duration, barCount = 80 }: WaveformProps) => {
  const [heights, setHeights] = useState<number[]>([]);

  useEffect(() => {
    const generateHeights = () => {
      return Array.from({ length: barCount }, () => 20 + Math.random() * 80);
    };
    setHeights(generateHeights());
  }, [barCount]);
  
  const playedBars = Math.floor((currentTime / duration) * barCount);

  return (
    <div className="flex items-center gap-[2px] h-16 md:h-20 lg:h-24 cursor-pointer">
      {heights.map((height, i) => (
        <div
          key={i}
          className="flex-1 transition-all duration-75 rounded-full"
          style={{
            height: `${height}%`,
            backgroundColor: i < playedBars ? '#6E94B1' : '#CCCCCC',
            minWidth: '3px'
          }}
        />
      ))}
    </div>
  );
};
