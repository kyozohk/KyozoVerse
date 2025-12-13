'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, PauseCircle, Edit, Trash2, Lock, Play, Pause } from "lucide-react";
import { useCommunityAuth } from "@/hooks/use-community-auth";
import { type Post } from "@/lib/types";
import { deletePost } from "@/lib/post-utils";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { recordInteraction } from '@/lib/interaction-utils';

interface AudioPostCardProps {
  post: Post & { id: string; _isPublicView?: boolean; _onEdit?: () => void; _canEdit?: boolean };
}

export const AudioPostCard: React.FC<AudioPostCardProps> = ({ post }) => {
  const { user } = useCommunityAuth();
  const { toast } = useToast();
  const isPostCreator = user && !post._isPublicView && (post.authorId === user.uid || post._canEdit);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const handleDelete = async () => {
    if (!post.id) return;
    
    setIsDeleting(true);
    try {
      await deletePost(post.id, post.content.mediaUrls);
      toast({
        title: "Post deleted",
        description: "Your audio post has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        title: "Error",
        description: "Failed to delete audio post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };
  
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
        if (user && post.id && post.communityId) {
          recordInteraction({
            userId: user.uid,
            postId: post.id,
            communityId: post.communityId,
            interactionType: 'play',
            mediaType: 'audio',
          });
        }
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
    if (user && post.id && post.communityId) {
      recordInteraction({
        userId: user.uid,
        postId: post.id,
        communityId: post.communityId,
        interactionType: 'finish',
        mediaType: 'audio',
        playDurationSeconds: duration,
      });
    }
  };
  
  return (
    <>
      <div className="relative overflow-hidden rounded-lg shadow-md transition-all hover:shadow-lg bg-white border border-gray-200">
        {isPostCreator && (
          <div className="absolute top-2 right-2 flex gap-1 z-20">
            <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 hover:bg-white rounded-full" onClick={() => post._onEdit?.()}>
              <Edit className="h-4 w-4 text-gray-700" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 bg-white/80 hover:bg-white rounded-full"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        )}
        
        <div className="p-4">
          {/* Header with badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-medium uppercase">Listen</span>
            <span className="text-gray-500 text-xs">
              {post.type === 'audio' ? 'PODCAST • EPISODE 12 • 45:00' : 'AUDIO'}
            </span>
            {post.visibility === 'private' && (
              <span className="text-xs font-semibold rounded-full px-2 py-1 bg-red-100 text-red-600 inline-flex items-center gap-1">
                <Lock className="h-3 w-3" /> Private
              </span>
            )}
          </div>
          
          {/* Title */}
          <h3 className="text-gray-900 text-lg font-semibold mb-2 line-clamp-2">{post.title}</h3>
          
          {/* Description */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{post.content.text}</p>
          
          {/* Audio player */}
          {post.content.mediaUrls && post.content.mediaUrls.length > 0 ? (
            <>
              <audio 
                ref={audioRef} 
                src={post.content.mediaUrls[0]} 
                className="hidden"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleAudioEnded}
              />
              
              {/* Waveform visualization placeholder */}
              <div className="w-full h-16 mb-3 flex items-center gap-0.5">
                {[...Array(60)].map((_, i) => (
                  <div 
                    key={i}
                    className="flex-1 bg-blue-200 rounded-full transition-all"
                    style={{ 
                      height: `${Math.random() * 60 + 20}%`,
                      backgroundColor: i < (currentTime / duration) * 60 ? '#3B82F6' : '#DBEAFE'
                    }}
                  />
                ))}
              </div>
              
              {/* Controls */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={togglePlayPause}
                  className="bg-blue-500 hover:bg-blue-600 rounded-full p-3 transition-colors flex-shrink-0"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5 text-white" />
                  ) : (
                    <Play className="h-5 w-5 text-white ml-0.5" />
                  )}
                </button>
                
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                  <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full rounded-full transition-all" 
                      style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm">
              No audio file available
            </div>
          )}
        </div>
      </div>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your audio post
              and remove the data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
