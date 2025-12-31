
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
  const [likes, setLikes] = useState(post?.likes ?? 0);

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
    backgroundImage: `url(${imageUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  return (
    <div className="relative bg-neutral-900 overflow-hidden shadow-md group cursor-pointer transition-all duration-300 hover:shadow-xl ease-in-out hover:scale-[1.02] min-h-[400px] rounded-lg" style={cardStyle}>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      
      <div className="relative z-10 p-4 md:p-6 flex flex-col justify-between h-full min-h-[400px]">
        <div className="flex justify-between">
            <span className="px-2 py-1 md:px-2.5 md:py-1.5 text-[10px] md:text-xs uppercase tracking-wide bg-yellow-400 text-neutral-900 rounded-full shadow-md">
            {category}
            </span>
            {isPrivate && (
                <div className="bg-red-500 rounded-full p-2 shadow-lg">
                    <Lock className="w-4 h-4 text-white" />
                </div>
            )}
        </div>
        
        <div>
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
                <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                    <Play className="w-5 h-5 ml-1" />
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
