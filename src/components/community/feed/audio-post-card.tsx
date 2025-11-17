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
  post: Post & { id: string; _isPublicView?: boolean };
}

export const AudioPostCard: React.FC<AudioPostCardProps> = ({ post }) => {
  const { user } = useCommunityAuth();
  const { toast } = useToast();
  const isPostCreator = user && post.authorId === user.uid && !post._isPublicView;
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
      <div className="relative overflow-hidden rounded-lg shadow-lg transition-all hover:shadow-xl">
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 z-0" />
        
        {isPostCreator && (
          <div className="absolute top-2 right-2 flex gap-1 z-20">
            <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 hover:bg-white rounded-full">
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
        
        <div className="relative z-10 p-6 flex flex-col">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="bg-[#5B91D7] text-white px-4 py-1 rounded-full text-sm font-medium">Listen</span>
            <span className="bg-transparent border border-[#5B91D7] text-[#5B91D7] px-4 py-1 rounded-full text-sm">
              Music
            </span>
            {post.visibility === 'private' && (
              <span className="text-xs font-semibold rounded-full px-3 py-1 bg-gray-200 text-gray-700 inline-flex items-center gap-1">
                <Lock className="h-3 w-3" /> Private
              </span>
            )}
          </div>
          
          <h3 className="text-slate-800 text-xl font-medium mb-2">{post.title}</h3>
          
          <p className="text-slate-700 mb-6">{post.content.text}</p>
          
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
              
              <div className="w-full bg-[#5B91D7]/20 h-2 rounded-full mb-2 overflow-hidden">
                <div 
                  className="bg-[#5B91D7] h-full rounded-full" 
                  style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between items-center mt-2">
                <span className="text-slate-600 text-sm">{formatTime(currentTime)} / {formatTime(duration)}</span>
                
                <button 
                  onClick={togglePlayPause}
                  className="bg-[#5B91D7] rounded-full p-2"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4 text-white" />
                  ) : (
                    <Play className="h-4 w-4 text-white ml-0.5" />
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4 text-gray-500">
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
