
'use client';

import React from 'react';
import { ReadCard } from './read-card';
import { ListenCard } from './listen-card';
import { WatchCard } from './watch-card';
import { MiniCard, MiniListenCard, MiniWatchCard } from './mini-card';
import './content-cards.css';

export function CreativeFeed() {
  return (
    <div>
      <div className="sticky top-0 z-50 relative w-full bg-[rgba(245,241,232,0.15)] backdrop-blur-sm border-b border-[rgba(79,91,102,0.08)]">
        <div className="flex flex-row items-center w-full">
          <div className="content-stretch flex items-center justify-between px-4 md:px-8 lg:px-12 py-3 md:py-3.5 lg:py-4 relative w-full">
            <p className="font-['DM_Sans',sans-serif] font-bold leading-tight md:leading-[30px] lg:leading-[36.029px] relative shrink-0 text-[#93adae] text-[24px] md:text-[30px] lg:text-[36.696px] tracking-[-1px] md:tracking-[-1.2px] lg:tracking-[-1.3344px]">
              Willer Universe
            </p>
            <div className="hidden md:block">
              {/* Navigation can be made a component later */}
            </div>
          </div>
        </div>
      </div>
      <div id="grid-container" className="h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] lg:h-[calc(100vh-120px)] overflow-hidden">
        <div className="flex gap-4 md:gap-5 lg:gap-7 px-4 md:px-6 lg:px-8 h-full">
          {/* Column 1 */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="space-y-4 md:space-y-5 lg:space-y-7 py-4 md:py-6 lg:py-8 px-2">
              <ReadCard
                category="Visual Arts"
                readTime="8 min read"
                date="Dec 2024"
                title="The Evolution of Street Art"
                summary="Street art has transformed from underground rebellion to celebrated cultural expression, reshaping urban landscapes worldwide."
                fullText="In the past two decades, what was once considered vandalism has evolved into a respected art form that commands museum exhibitions and attracts millions in investment. Cities like Berlin, Melbourne, and Miami have embraced street art, creating designated zones where artists can legally express their creativity..."
              />
              <ReadCard
                category="Writing"
                readTime="5 min read"
                date="Nov 2024"
                title="On Creative Block and Finding Flow"
                summary="Every artist faces the void. Here's how I learned to embrace it rather than fear it."
                fullText="Creative block isn't the enemy—it's a signal. After years of fighting against those dry spells, I've come to understand them as necessary pauses in the creative process. The key is not to force it..."
                titleColor="#675263"
              />
              <ListenCard 
                category="Podcast"
                episode="Episode 12"
                duration="45:00"
                title="Conversations: Creative Process"
                summary="A deep dive into how different artists approach their work."
              />
            </div>
          </div>
          {/* Column 2 */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
             <div className="space-y-4 md:space-y-5 lg:space-y-7 py-4 md:py-6 lg:py-8 px-2">
                <WatchCard
                    category="Live Performance"
                    title="Live Performance: Stage Presence"
                    imageUrl="https://picsum.photos/seed/content-card-1/800/600"
                    imageHint="live performance stage"
                />
                <ReadCard
                    category="Audio"
                    readTime="4 min read"
                    title="The Warmth Debate"
                    summary="Is vinyl really warmer, or is it nostalgia?"
                    fullText="Audiophiles have debated this for decades. Vinyl advocates claim analog formats capture something digital misses—warmth, depth, presence. Skeptics say it's just distortion and limitation..."
                    titleColor="#675263"
                />
                <div className="grid grid-cols-2 gap-2 md:gap-2.5 lg:gap-3 w-full">
                    <MiniCard
                        category="Quick Tip"
                        readTime="2 min read"
                        title="Tool Tips For Everyday Creative Workflow"
                        summary="Shortcut I use daily."
                    />
                    <MiniWatchCard
                        category="Video"
                        duration="1:20"
                        title="Desk Setup And Creative Space Vibes"
                    />
                    <MiniListenCard
                        category="Demo"
                        duration="1:00"
                        title="Idea Loop From Today Making Session"
                    />
                     <MiniCard
                        category="Note"
                        readTime="1 min"
                        title="On Simplicity And Creative Work Process"
                        summary="Less is often more in creative work."
                        titleColor="#675263"
                        titleClassName="text-[24px] md:text-[32px] lg:text-[38px]"
                        fontFamily="Inter"
                        fontWeight="bold"
                     />
                </div>
            </div>
          </div>
          {/* Column 3 */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="space-y-4 md:space-y-5 lg:space-y-7 py-4 md:py-6 lg:py-8 px-2">
                 <ListenCard
                    category="Electronic"
                    episode="Demo"
                    duration="3:45"
                    title="Midnight Frequencies - Demo"
                    summary="An experimental journey through ambient soundscapes."
                />
                <WatchCard
                    category="Exhibition"
                    title="Exhibition Walkthrough"
                    imageUrl="https://picsum.photos/seed/content-card-2/800/600"
                    imageHint="art exhibition gallery"
                />
                <ReadCard
                    category="Technology"
                    readTime="8 min read"
                    date="Dec 2024"
                    title="Digital Tools, Analog Mindset"
                    summary="Using modern tools without losing the human touch."
                    fullText="Digital tools offer incredible power and flexibility. But they can also homogenize our work if we're not careful. When everyone uses the same software with the same presets, everything starts looking the same..."
                />
                <WatchCard
                    category="Art"
                    title="Making Process Visible"
                    imageUrl="https://picsum.photos/seed/content-card-3/800/600"
                    imageHint="art process making"
                />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
