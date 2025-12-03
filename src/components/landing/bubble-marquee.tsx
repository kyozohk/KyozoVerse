'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

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
  
  const getCategoryColors = () => {
    const colorMap: Record<string, { bg: string; border: string }> = {
      feed: { 
        bg: 'rgba(173, 216, 230, 0.3)',
        border: 'rgba(0, 112, 243, 0.4)',
      },
      overview: { 
        bg: 'rgba(221, 160, 221, 0.3)',
        border: 'rgba(138, 43, 226, 0.4)',
      },
      broadcast: { 
        bg: 'rgba(255, 228, 181, 0.3)',
        border: 'rgba(255, 140, 0, 0.4)',
      },
      members: { 
        bg: 'rgba(255, 182, 193, 0.3)',
        border: 'rgba(255, 105, 180, 0.4)',
      },
      inbox: { 
        bg: 'rgba(175, 238, 238, 0.3)',
        border: 'rgba(64, 224, 208, 0.4)',
      },
    };
    return (
      colorMap[category] || { 
        bg: 'rgba(200, 200, 200, 0.3)', 
        border: 'rgba(100, 100, 100, 0.4)' 
      }
    );
  };

  const colors = getCategoryColors();
  
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
            className="flex items-center justify-center gap-1 px-14 py-6 rounded-full font-medium text-lg transition-all duration-300 cursor-default hover:-translate-y-1 hover:shadow-lg"
            style={{ 
              backgroundColor: colors.bg,
              border: `2px solid ${colors.border}`,
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
      {categories.map((row, index) => (
        <BubbleRow 
          key={`row-${index}`}
          items={row.items}
          direction={index % 2 === 0 ? 'left' : 'right'}
          speed={50}
          category={row.category}
        />
      ))}
    </div>
  );
};

export default BubbleMarquee;
