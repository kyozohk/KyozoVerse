
'use client';

import React from 'react';

interface ReadCardProps {
  category: string;
  readTime: string;
  date?: string;
  title: string;
  summary?: string;
  fullText?: string;
  titleColor?: string;
  titleClassName?: string;
}

export function ReadCard({ category, readTime, date, title, summary, fullText, titleColor = '#504c4c' }: ReadCardProps) {
  const cardStyle = {
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
    backgroundColor: 'rgb(245, 241, 232)'
  };
  const innerDivStyle = {
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E\")"
  };

  return (
    <div className="bg-white overflow-hidden shadow-md cursor-pointer relative group cursor-pointer transition-all duration-300 hover:shadow-xl ease-in-out hover:scale-[1.02]" style={cardStyle}>
      <div className="p-4 md:p-6 lg:p-8 flex flex-col justify-between" style={innerDivStyle}>
        <div className="flex flex-col gap-3 md:gap-4 lg:gap-6">
          <div className="flex flex-col gap-2 md:gap-3 lg:gap-5">
            <div className="flex items-center gap-2 md:gap-2.5">
              <span className="px-2 py-1 md:px-2.5 md:py-1.5 text-[10px] md:text-xs uppercase tracking-wide bg-[#D946A6] text-white rounded-full shadow-md opacity-50">
                {category}
              </span>
              <p className="text-neutral-500 uppercase tracking-[0.3px] text-[10px] md:text-xs leading-4">
                {readTime} {date && `• ${date}`}
              </p>
            </div>
            <h2 className="leading-[1.1] text-2xl md:text-4xl lg:text-5xl" style={{ letterSpacing: '-1.5px', fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 600, color: titleColor }}>
              {title}
            </h2>
          </div>
          {summary && <p className="text-[#504c4c] leading-relaxed text-sm md:text-base lg:text-lg italic">{summary}</p>}
          {fullText && <p className="text-[#504c4c] leading-relaxed text-sm md:text-base line-clamp-3">{fullText}</p>}
        </div>
        <div className="pt-4 md:pt-5 lg:pt-7 flex-shrink-0">
          <span className="text-[#504c4c] hover:text-neutral-700 transition-colors uppercase tracking-[0.35px] text-xs md:text-sm">Read Full Article →</span>
        </div>
      </div>
    </div>
  );
}
