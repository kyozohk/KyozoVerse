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
  speed = 80, 
  category 
}) => {
  const repeatedItems = useMemo(() => {
    const repeated: BubbleItem[] = [];
    for (let i = 0; i < 4; i++) {
      repeated.push(...items);
    }
    return repeated;
  }, [items]);
  
  const { activeColor, activeBgColor } = getThemeForPath(`/${category}`);
  
  return (
    <div className="relative w-full overflow-hidden h-20 mb-px p-0">
      <div 
        className={cn(
          'absolute flex items-center whitespace-nowrap will-change-transform',
          direction === 'left' ? 'animate-scroll-left' : 'animate-scroll-right'
        )}
        style={{ '--scroll-duration': `${speed}s` } as React.CSSProperties}
      >
        {repeatedItems.map((item, index) => (
          <div 
            key={`item-${index}`} 
            className="flex items-center justify-center gap-1 px-14 py-6 rounded-full font-medium text-lg transition-all duration-300 cursor-default hover:brightness-70"
            style={{ 
              backgroundColor: activeBgColor,
              border: `2px solid ${activeColor}`,
              color: 'var(--text-color)',
            } as React.CSSProperties}
          >
            <span className="whitespace-nowrap">{item.text}</span>
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
          speed={100}
          category={row.category}
        />
      ))}
    </div>
  );
};

export default BubbleMarquee;
