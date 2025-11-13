'use client';

import { useState, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, PauseCircle, Edit, Trash2, Maximize2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { type Post } from "@/lib/types";

interface VideoPostCardProps {
  post: Post & { id: string };
}

export const VideoPostCard: React.FC<VideoPostCardProps> = ({ post }) => {
  const { user } = useAuth();
  const isPostCreator = user && post.authorId === user.uid;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => {
          console.error('Error playing video:', err);
          alert('Failed to play video. Please try again.');
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins} min ${secs} sec`;
  };

  return (
    <Card 
        className="overflow-hidden shadow-lg transition-all hover:border-orange-500/50 relative"
        style={{ backgroundImage: `url('/bg/video_bg.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {isPostCreator && (
        <div className="absolute top-2 right-2 flex gap-1 z-10">
          <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 hover:bg-white rounded-full">
            <Edit className="h-4 w-4 text-gray-700" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 hover:bg-white rounded-full">
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      )}
      
      {post.content.mediaUrls && post.content.mediaUrls.length > 0 ? (
        <div className={`w-full ${isExpanded ? 'h-[500px]' : 'h-64'} overflow-hidden relative`}>
          <video 
            ref={videoRef}
            src={post.content.mediaUrls[0]} 
            className="w-full h-full object-contain bg-black"
            poster="/bg/video_thumbnail.png"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            onError={(e) => console.error('Video error:', e)}
          />
          
          <div className="absolute bottom-4 right-4 flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 bg-black/50 hover:bg-black/70 rounded-full text-white"
              onClick={togglePlayPause}
            >
              {isPlaying ? (
                <PauseCircle className="h-5 w-5" />
              ) : (
                <PlayCircle className="h-5 w-5" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 bg-black/50 hover:bg-black/70 rounded-full text-white"
              onClick={toggleExpand}
            >
              <Maximize2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
          <p className="text-gray-500">No video available</p>
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold rounded-full px-3 py-1 bg-orange-500 text-white inline-flex items-center justify-center h-6 w-auto">Watch</span>
            <span className="text-xs text-gray-500">Short form video</span>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-black">{post.title}</h2>
        <p className="text-base mb-4 text-gray-700">{post.content.text}</p>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            {new Date(post.createdAt || Date.now()).toLocaleDateString()} - 
            {videoRef.current?.duration ? formatDuration(videoRef.current.duration) : '4 min video'}
          </span>
          <div className="flex items-center gap-2">
            <span className="uppercase font-medium">{isPlaying ? 'PAUSE' : 'WATCH'}</span>
            <div className="rounded-full bg-orange-500 p-1.5" onClick={togglePlayPause}>
              {isPlaying ? 
                <PauseCircle className="h-4 w-4 text-white" /> : 
                <PlayCircle className="h-4 w-4 text-white" />
              }
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
