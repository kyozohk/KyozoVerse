'use client';

import { useState, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, PauseCircle, Edit, Trash2, Maximize2, Lock, Play, Pause } from "lucide-react";
import { useCommunityAuth } from "@/hooks/use-community-auth";
import { type Post } from "@/lib/types";
import { deletePost } from "@/lib/post-utils";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { recordInteraction } from '@/lib/interaction-utils';

interface VideoPostCardProps {
  post: Post & { id: string; _isPublicView?: boolean; _onEdit?: () => void; _canEdit?: boolean };
}

export const VideoPostCard: React.FC<VideoPostCardProps> = ({ post }) => {
  const { user } = useCommunityAuth();
  const { toast } = useToast();
  const isPostCreator = user && !post._isPublicView && (post.authorId === user.uid || post._canEdit);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const handleDelete = async () => {
    if (!post.id) return;
    
    setIsDeleting(true);
    try {
      await deletePost(post.id, post.content.mediaUrls);
      toast({
        title: "Post deleted",
        description: "Your video post has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        title: "Error",
        description: "Failed to delete video post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };
  
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => {
          console.error('Error playing video:', err);
          alert('Failed to play video. Please try again.');
        });
        if (user && post.id && post.communityId) {
          recordInteraction({
            userId: user.uid,
            postId: post.id,
            communityId: post.communityId,
            interactionType: 'play',
            mediaType: 'video',
          });
        }
      }
    }
  };

  const handleVideoEnded = () => {
    if (user && post.id && post.communityId && videoRef.current) {
      recordInteraction({
        userId: user.uid,
        postId: post.id,
        communityId: post.communityId,
        interactionType: 'finish',
        mediaType: 'video',
        playDurationSeconds: videoRef.current.duration,
      });
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const formatVideoDuration = () => {
    if (!videoRef.current?.duration) return '0:00';
    const duration = videoRef.current.duration;
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  return (
    <>
      <div className="relative overflow-hidden rounded-lg shadow-lg transition-all hover:shadow-xl">
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-amber-50 to-orange-50 z-0" />
        
        {isPostCreator && (
          <div className="absolute top-2 right-2 flex gap-1 z-30">
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
        
        <div className="relative z-10">
          {post.content.mediaUrls && post.content.mediaUrls.length > 0 ? (
            <div className="relative">
              <div className={`w-full ${isExpanded ? 'h-[400px]' : 'h-64'} overflow-hidden`}>
                <video 
                  ref={videoRef}
                  src={post.content.mediaUrls[0]} 
                  className="w-full h-full object-cover"
                  poster="/bg/video_thumbnail.png"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={handleVideoEnded}
                  onError={(e) => console.error('Video error:', e)}
                />
              </div>
              
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button 
                  onClick={togglePlayPause}
                  className="bg-[#FFB619] rounded-full p-2"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4 text-white" />
                  ) : (
                    <Play className="h-4 w-4 text-white ml-0.5" />
                  )}
                </button>
                <button 
                  onClick={toggleExpand}
                  className="bg-black/40 rounded-full p-2 text-white"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
              <p className="text-gray-500">No video available</p>
            </div>
          )}
          
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="bg-[#FFB619] text-white px-4 py-1 rounded-full text-sm font-medium">Watch</span>
              <span className="bg-transparent border border-[#FFB619] text-[#FFB619] px-4 py-1 rounded-full text-sm">
                Short form video
              </span>
              {post.visibility === 'private' && (
                <span className="text-xs font-semibold rounded-full px-3 py-1 bg-gray-200 text-gray-700 inline-flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Private
                </span>
              )}
            </div>
            
            <h3 className="text-slate-800 text-xl font-medium mb-2">{post.title}</h3>
            
            <p className="text-slate-700 mb-4">{post.content.text}</p>
            
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200">
              <span className="text-slate-600 text-sm">
                {new Date(post.createdAt || Date.now()).toLocaleDateString()} • 
                {videoRef.current?.duration ? formatVideoDuration() : '0:00'}
              </span>
              
              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-medium">{isPlaying ? 'PAUSE' : 'WATCH'}</span>
                <div 
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-[#FFB619] cursor-pointer"
                  onClick={togglePlayPause}
                >
                  {isPlaying ? 
                    <Pause className="h-4 w-4 text-white" /> : 
                    <Play className="h-4 w-4 text-white ml-0.5" />
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your video post
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
