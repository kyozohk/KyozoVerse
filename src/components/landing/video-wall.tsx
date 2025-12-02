
'use client';
import React, { useMemo, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// Video sources should be in the /public folder
const VIDEO_SOURCES = [
  '/videos/city.mp4',
  '/videos/concert.mp4',
  '/videos/crafting.mp4',
  '/videos/dancer.mp4',
  '/videos/lights.mp4',
  '/videos/paint.mp4',
  '/videos/performance.mp4',
  '/videos/pottery.mp4',
  '/videos/prod.mp4',
  '/videos/producing.mp4',
];

interface BrickProps {
  videoSrc: string;
}

const Brick: React.FC<BrickProps> = ({ videoSrc }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // This effect ensures videos play on mount, which is important for animations
    if (videoRef.current) {
      videoRef.current.play().catch(e => {
        // Autoplay can be blocked by browsers, this is expected.
        // The videos are muted, so it's usually allowed.
      });
    }
  }, []);

  return (
    <div className="w-[19rem] h-[8rem] rounded-full shadow-md overflow-hidden relative">
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
};

interface RowProps {
  layout: 'A' | 'B';
  videos: [string, string];
}

const Row: React.FC<RowProps> = ({ layout, videos }) => {
  const layoutClasses = layout === 'A' 
    ? 'space-x-[1.5rem]' 
    : 'space-x-[1.5rem] ml-[9.5rem]'; // Offset for layout B (half brick width)

  return (
    <div className={cn("relative w-full max-w-[54rem] mb-[3rem] h-[7.5rem] flex", layoutClasses)}>
      <Brick videoSrc={videos[0]} />
      <Brick videoSrc={videos[1]} />
    </div>
  );
};

const VideoWall: React.FC = () => {
  const ROW_COUNT = 10;

  // Memoize rows to prevent re-computation on re-renders
  const initialRows = useMemo(() =>
    Array.from({ length: ROW_COUNT }, (_, i) => {
      const firstVideoIndex = (i * 2) % VIDEO_SOURCES.length;
      const secondVideoIndex = (firstVideoIndex + 1) % VIDEO_SOURCES.length;
      return {
        id: i,
        layout: i % 2 === 0 ? 'A' : 'B' as 'A' | 'B',
        videos: [VIDEO_SOURCES[firstVideoIndex], VIDEO_SOURCES[secondVideoIndex]] as [string, string],
      };
    }), []);

  // Double the rows for seamless looping effect
  const doubledRows = [...initialRows, ...initialRows];

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="relative w-full h-full">
        <div className="animate-scroll-up w-full">
          {doubledRows.map((row, index) => (
            <Row
              key={`${row.id}-${index}`}
              layout={row.layout}
              videos={row.videos}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoWall;
