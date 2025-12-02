
'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { getThemeForPath } from '@/lib/theme-utils';

interface BubbleItem {
  text: string;
}

interface BubbleCategory {
  category: string;
  items: BubbleItem[];
}

interface BubbleRowProps {
  items: BubbleItem[];
  direction: 'left' | 'right';
  speed?: number;
  category: string;
}

const BubbleRow: React.FC<BubbleRowProps> = ({ 
  items, 
  direction, 
  speed = 100, 
  category 
}) => {
  const { activeColor } = getThemeForPath(`/${category}`);
  
  const repeatedItems = useMemo(() => {
    const repeated = [];
    for (let i = 0; i < 15; i++) {
      repeated.push(...items);
    }
    return repeated;
  }, [items]);
  
  return (
    <div className="relative w-full overflow-hidden h-[10rem] md:h-[6.3rem] lg:h-[10rem] py-4">
      <div 
        className={cn(
          "absolute flex whitespace-nowrap will-change-transform w-max",
          direction === 'left' ? 'animate-scroll-left' : 'animate-scroll-right'
        )}
        style={{ '--scroll-duration': `${speed}s` } as React.CSSProperties}
      >
        {repeatedItems.map((item, index) => (
          <div 
            key={`item-${index}`} 
            className="flex items-center justify-center px-16 md:px-14 lg:px-32 py-12 md:py-8 lg:py-12 rounded-full font-normal text-4xl md:text-2xl lg:text-5xl border-[1.5px] transition-all duration-300 cursor-default -mr-px text-foreground hover:text-white"
            style={{ 
              borderColor: activeColor,
              '--hover-bg': activeColor,
            } as React.CSSProperties}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = activeColor}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {item.text}
          </div>
        ))}
      </div>
    </div>
  );
};

interface BubbleMarqueeProps {
  categories: BubbleCategory[];
}

const BubbleMarquee: React.FC<BubbleMarqueeProps> = ({ categories }) => {
  return (
    <div className="w-full block overflow-hidden pt-32">
      {categories.map((row, index) => (
        <BubbleRow 
          key={`row-${index}`}
          items={row.items}
          direction={index % 2 === 0 ? 'left' : 'right'}
          category={row.category}
        />
      ))}
    </div>
  );
};

export default BubbleMarquee;
