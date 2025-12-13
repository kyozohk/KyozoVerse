
'use client';
import React from 'react';
import { Play } from 'lucide-react';

interface MiniCardProps {
  category: string;
  readTime: string;
  title: string;
  summary?: string;
  titleColor?: string;
  titleClassName?: string;
  fontFamily?: string;
  fontWeight?: string;
}

export function MiniCard({ category, readTime, title, summary, titleColor = '#504c4c', titleClassName, fontFamily, fontWeight }: MiniCardProps) {
  const cardStyle = {
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E\")",
    backgroundColor: 'rgb(245, 241, 232)'
  };
  const titleStyle: React.CSSProperties = {
    letterSpacing: '-1.5px',
    fontFamily: fontFamily ? `${fontFamily}, system-ui, -apple-system, sans-serif` : 'system-ui, -apple-system, sans-serif',
    fontWeight: fontWeight || 600,
    color: titleColor
  };

  return (
    <div className="aspect-square overflow-hidden relative group cursor-pointer transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-2xl">
      <div className="p-2 md:p-3 lg:p-4 h-full flex flex-col justify-between text-sm" style={cardStyle}>
        <div>
          <div className="flex items-center gap-1 md:gap-1.5 mb-1 md:mb-1.5 lg:mb-2 flex-wrap">
            <span className="px-1.5 py-0.5 md:px-2 md:py-1 text-[8px] md:text-[10px] uppercase tracking-wide rounded-full shadow-md bg-[#D946A6] text-white opacity-50">{category}</span>
            <p className="text-neutral-500 text-[9px] md:text-[10px] lg:text-xs uppercase tracking-wide">{readTime}</p>
          </div>
          <h3 className={`mb-1 md:mb-1.5 lg:mb-2 leading-[1.1] ${titleClassName || 'text-[24px] md:text-[32px] lg:text-[38px]'}`} style={titleStyle}>
            {title}
          </h3>
          {summary && <p className="text-neutral-700 text-[9px] md:text-[10px] lg:text-xs leading-relaxed line-clamp-4">{summary}</p>}
        </div>
        <div className="mt-1 md:mt-1.5 lg:mt-2 pt-1 md:pt-1.5 lg:pt-2">
          <span className="text-neutral-900 text-[9px] md:text-[10px] lg:text-xs uppercase tracking-wide">Read more →</span>
        </div>
      </div>
    </div>
  );
}


interface MiniListenCardProps {
    category: string;
    duration: string;
    title: string;
  }
  
export function MiniListenCard({ category, duration, title }: MiniListenCardProps) {
    const cardStyle = {
      backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E\")",
      backgroundColor: 'rgb(245, 241, 232)'
    };
    return (
      <div className="aspect-square overflow-hidden relative group cursor-pointer transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-2xl">
        <div className="p-2 md:p-3 lg:p-4 h-full flex flex-col justify-between text-sm" style={cardStyle}>
          <div>
            <div className="flex items-center gap-1 md:gap-1.5 mb-1 md:mb-1.5 lg:mb-2 flex-wrap">
              <span className="px-1.5 py-0.5 md:px-2 md:py-1 text-[8px] md:text-[10px] uppercase tracking-wide rounded-full shadow-md bg-[rgb(29,130,168)] text-white opacity-50">{category}</span>
              <p className="text-neutral-600 text-[9px] md:text-[10px] lg:text-xs uppercase tracking-wide">{duration}</p>
            </div>
            <h3 className="mb-1 md:mb-1.5 lg:mb-2 leading-[1.1] text-xl" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 600, letterSpacing: '-1.5px', color: 'rgb(80, 76, 76)' }}>{title}</h3>
          </div>
          <div className="space-y-2 md:space-y-2.5">
            <div className="h-1 md:h-1.5 bg-neutral-300 rounded-full">
              <div className="h-full bg-[#FFB088] rounded-full transition-all" style={{ width: '0%' }}></div>
            </div>
            <div className="flex items-center justify-between">
              <button className="w-7 h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 rounded-full bg-[#FFB088] hover:bg-[#FFC4A3] flex items-center justify-center transition-all shadow-md">
                <Play className="w-3 h-3 md:w-3.5 md:h-3.5 text-white ml-0.5" />
              </button>
              <div className="text-neutral-600 text-[9px] md:text-[10px] lg:text-xs">
                <span>0:00</span>
                <span className="mx-0.5 md:mx-1">/</span>
                <span>0:00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  interface MiniWatchCardProps {
    category: string;
    duration: string;
    title: string;
  }
  export function MiniWatchCard({ category, duration, title }: MiniWatchCardProps) {
    const cardStyle = {
      backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E\")",
      backgroundColor: 'rgb(103, 82, 99)'
    };
    return (
      <div className="aspect-square overflow-hidden relative group cursor-pointer transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-2xl">
        <div className="p-2 md:p-3 lg:p-4 h-full flex flex-col justify-between text-sm" style={cardStyle}>
          <div>
            <div className="flex items-center gap-1 md:gap-1.5 mb-1 md:mb-1.5 lg:mb-2 flex-wrap">
              <span className="px-1.5 py-0.5 md:px-2 md:py-1 text-[8px] md:text-[10px] uppercase tracking-wide rounded-full shadow-md bg-[#FBBF24] text-neutral-900 opacity-50">{category}</span>
              <p className="text-[#e7cee6]/80 text-[9px] md:text-[10px] lg:text-xs uppercase tracking-wide">{duration}</p>
            </div>
            <h3 className="text-[#e7cee6] mb-1 md:mb-1.5 lg:mb-2 leading-[1.1] text-xl" style={{ letterSpacing: '-1.5px', fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 600 }}>{title}</h3>
          </div>
          <div className="mt-1 md:mt-1.5 lg:mt-2 pt-1 md:pt-1.5 lg:pt-2">
            <span className="text-[#e7cee6] text-[9px] md:text-[10px] lg:text-xs uppercase tracking-wide">Watch →</span>
          </div>
        </div>
      </div>
    );
  }
