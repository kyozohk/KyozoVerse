'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, PauseCircle, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { type Post } from "@/lib/types";

interface AudioPostCardProps {
  post: Post & { id: string };
}

export const AudioPostCard: React.FC<AudioPostCardProps> = ({ post }) => {
  const { user } = useAuth();
  const isPostCreator = user && post.authorId === user.uid;
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Format time in MM:SS format
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(err => {
          console.error('Error playing audio:', err);
          alert('Failed to play audio. Please try again.');
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <Card 
        className="overflow-hidden shadow-lg transition-all hover:border-blue-500/50 relative"
        style={{ backgroundImage: `url('/bg/audio_bg.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
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
      <div className="p-6">
        <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold rounded-full px-3 py-1 bg-blue-500 text-white inline-flex items-center justify-center h-6 w-auto">Listen</span>
            <span className="text-xs text-gray-500">Music</span>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-black">{post.title}</h2>
        <p className="text-base mb-4 text-gray-700">{post.content.text}</p>
        
        {post.content.mediaUrls && post.content.mediaUrls.length > 0 ? (
          <>
            <audio 
              ref={audioRef} 
              src={post.content.mediaUrls[0]} 
              className="hidden"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleAudioEnded}
              onError={(e) => console.error('Audio error:', e)}
            />
            <div className="flex items-center justify-between">
              <div className="flex-grow flex items-center gap-2">
                <div className="flex-grow bg-gray-300 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 whitespace-nowrap">
                  {formatTime(currentTime)}/{formatTime(duration || 0)}
                </span>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <div className="rounded-full bg-blue-500 p-1.5" onClick={togglePlayPause}>
                  {isPlaying ? (
                    <PauseCircle className="h-4 w-4 text-white" />
                  ) : (
                    <PlayCircle className="h-4 w-4 text-white" />
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4 text-gray-500">
            No audio file available
          </div>
        )}
      </div>
    </Card>
  );
};
