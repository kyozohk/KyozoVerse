
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
    const repeated = [];
    for (let i = 0; i < 4; i++) {
      repeated.push(...items);
    }
    return repeated;
  }, [items]);
  
  // Get background color based on category
  const { activeColor: color, activeBgColor: bgColor } = getThemeForPath(`/${category}`);
  
  return (
    <div className="relative w-full overflow-hidden h-24 my-px p-0">
      <div 
        className={cn(
          "absolute flex items-center whitespace-nowrap will-change-transform",
          direction === 'left' ? 'animate-scroll-left' : 'animate-scroll-right'
        )}
        style={{ '--scroll-duration': `${speed}s` } as React.CSSProperties}
      >
        {repeatedItems.map((item, index) => (
          <div 
            key={`item-${index}`} 
            className="flex items-center justify-center px-14 py-6 rounded-full font-medium text-lg transition-all duration-300 cursor-default hover:-translate-y-1 hover:shadow-lg mr-[-1px]"
            style={{ 
              backgroundColor: bgColor,
              border: `2px solid ${color}`,
              color: '#1a1a1a',
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
      <div className="flex flex-col gap-px">
        {categories.map((row, index) => (
          <BubbleRow 
            key={`row-${index}`}
            items={row.items}
            direction={index % 2 === 0 ? 'left' : 'right'}
            speed={80}
            category={row.category}
          />
        ))}
      </div>
    </div>
  );
};

export default BubbleMarquee;
