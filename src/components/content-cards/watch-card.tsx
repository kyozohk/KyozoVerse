
'use client';

import React, { useState } from 'react';
import { Play, Volume2, ThumbsUp, MessageSquare, Share2, Lock } from 'lucide-react';
import { Button } from '../ui';
import { Post } from '@/lib/types';
import { useCommunityAuth } from '@/hooks/use-community-auth';
import { toggleLike } from '@/lib/interaction-utils';
import { useToast } from '@/hooks/use-toast';

interface WatchCardProps {
  category: string;
  title: string;
  imageUrl: string;
  imageHint: string;
  isPrivate?: boolean;
  post: Post & { id: string };
}

export function WatchCard({ category, title, imageUrl, imageHint, isPrivate, post }: WatchCardProps) {
  const { user } = useCommunityAuth();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes || 0);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like posts.",
        variant: "destructive",
      });
      return;
    }
    try {
      const { liked, likesCount } = await toggleLike(post.id, user.uid);
      setIsLiked(liked);
      setLikes(likesCount);
    } catch (error) {
       toast({
        title: "Error",
        description: "Could not update like status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast({ title: "Coming Soon", description: "Commenting functionality will be available soon."});
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast({ title: "Coming Soon", description: "Sharing functionality will be available soon."});
  };
  
  const cardStyle = {
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.1'/%3E%3C/svg%3E\")",
    backgroundColor: 'rgb(245, 241, 232)'
  };

  return (
    <div className="relative bg-neutral-900 overflow-hidden shadow-md border border-neutral-200 group cursor-pointer transition-all duration-300 hover:shadow-xl ease-in-out hover:scale-[1.02] min-h-[400px]" style={cardStyle}>
      <video 
        src={imageUrl} 
        className="w-full h-full object-cover absolute inset-0"
        data-ai-hint={imageHint}
        controls
        preload="metadata"
        style={{ minHeight: '400px' }}
      >
        <source src={imageUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="absolute top-4 left-4 md:top-6 md:left-6">
        <span className="px-2 py-1 md:px-2.5 md:py-1.5 text-[10px] md:text-xs uppercase tracking-wide bg-[#FBBF24] text-neutral-900 rounded-full shadow-md opacity-50">
          {category}
        </span>
      </div>
      {isPrivate && (
        <div className="absolute top-4 right-4 md:top-6 md:right-6">
          <div className="bg-red-500 rounded-full p-2 shadow-lg">
            <Lock className="w-4 h-4 text-white" />
          </div>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 pt-12 pb-3 px-4 md:px-6">
        <h2 className="text-white leading-tight mb-4 drop-shadow-lg text-xl md:text-2xl" style={{ letterSpacing: '-0.5px', fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 600 }}>
          {title}
        </h2>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="flex items-center gap-1 text-white" onClick={handleLike}>
                    <ThumbsUp className={`h-4 w-4 ${isLiked ? 'text-yellow-400' : ''}`} />
                    <span>{likes}</span>
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center gap-1 text-white" onClick={handleComment}>
                    <MessageSquare className="h-4 w-4" />
                    <span>{post.comments || 0}</span>
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center gap-1 text-white" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                </Button>
            </div>
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              <button className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-white hover:text-white/80 transition-colors drop-shadow-lg">
                  <Volume2 className="w-5 h-5 md:w-5.5 md:h-5.5" />
              </button>
          </div>
        </div>
      </div>
    </div>
  );
}
