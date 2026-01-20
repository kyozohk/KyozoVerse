
'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

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

  const categoryStyles: Record<string, string> = {
    inbox: "bg-blue-100 border-blue-200 text-blue-800",
    overview: "bg-purple-100 border-purple-200 text-purple-800",
    broadcast: "bg-yellow-100 border-yellow-200 text-yellow-800",
    members: "bg-red-100 border-red-200 text-red-800",
    feed: "bg-teal-100 border-teal-200 text-teal-800",
    default: "bg-accent border-border text-accent-foreground",
  };
  
  const bubbleClasses = categoryStyles[category] || categoryStyles.default;
  
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
            className={cn(
              "flex items-center justify-center gap-1 px-14 py-6 rounded-full font-light text-lg transition-all duration-300 cursor-default border-2 hover:brightness-95",
              bubbleClasses
            )}
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
