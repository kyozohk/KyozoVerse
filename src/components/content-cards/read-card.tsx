
'use client';

import React from 'react';
import { Lock, ThumbsUp, MessageSquare, Share2 } from 'lucide-react';
import { Button } from '../ui';
import { Post } from '@/lib/types';
import { useCommunityAuth } from '@/hooks/use-community-auth';
import { toggleLike } from '@/lib/interaction-utils';
import { useState } from 'react';

interface ReadCardProps {
  category: string;
  readTime: string;
  date?: string;
  title: string;
  summary?: string;
  fullText?: string;
  titleColor?: string;
  isPrivate?: boolean;
  post: Post & { id: string };
}

export function ReadCard({ category, readTime, date, title, summary, fullText, titleColor = '#504c4c', isPrivate, post }: ReadCardProps) {
  const { user } = useCommunityAuth();
  const [isLiked, setIsLiked] = useState(false); // This should be fetched from user-specific data
  const [likes, setLikes] = useState(post.likes || 0);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (!user) {
      // Or trigger sign-in dialog
      alert("Please sign in to like posts.");
      return;
    }
    const { liked, likesCount } = await toggleLike(post.id, user.uid);
    setIsLiked(liked);
    setLikes(likesCount);
  };
  
  const cardStyle = {
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
    backgroundColor: 'rgb(245, 241, 232)'
  };
  const innerDivStyle = {
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E\")"
  };

  return (
    <div className="bg-white overflow-hidden shadow-md cursor-pointer relative group cursor-pointer transition-all duration-300 hover:shadow-xl ease-in-out hover:scale-[1.02]" style={cardStyle}>
      {isPrivate && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-red-500 rounded-full p-2 shadow-lg">
            <Lock className="w-4 h-4 text-white" />
          </div>
        </div>
      )}
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="flex items-center gap-1 text-gray-600" onClick={handleLike}>
                    <ThumbsUp className={`h-4 w-4 ${isLiked ? 'text-primary' : ''}`} />
                    <span>{likes}</span>
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center gap-1 text-gray-600">
                    <MessageSquare className="h-4 w-4" />
                    <span>{post.comments || 0}</span>
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center gap-1 text-gray-600">
                    <Share2 className="h-4 w-4" />
                </Button>
            </div>
            <span className="text-[#504c4c] hover:text-neutral-700 transition-colors uppercase tracking-[0.35px] text-xs md:text-sm">Read Full Article →</span>
          </div>
        </div>
      </div>
    </div>
  );
}
