
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Lock, ThumbsUp, MessageSquare, Share2, Pause, Edit, Trash2 } from 'lucide-react';
import { Button } from '../ui';
import { Post } from '@/lib/types';
import { useCommunityAuth } from '@/hooks/use-community-auth';
import { toggleLike, recordInteraction } from '@/lib/interaction-utils';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { deletePost } from '@/lib/post-utils';

interface WatchCardProps {
  category: string;
  title: string;
  imageUrl: string;
  imageHint: string;
  isPrivate?: boolean;
  post: Post & { id: string; _isPublicView?: boolean; _onEdit?: () => void; _canEdit?: boolean };
}

export function WatchCard({ category, title, imageUrl, imageHint, isPrivate, post }: WatchCardProps) {
  const { user } = useCommunityAuth();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(post?.likes ?? 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [thumbnail, setThumbnail] = useState<string>(imageUrl);
  const isPostCreator = user && !post._isPublicView && (post.authorId === user.uid || post._canEdit);
  const videoRef = useRef<HTMLVideoElement>(null);
  const thumbnailVideoRef = useRef<HTMLVideoElement>(null);

  // Extract thumbnail from video
  useEffect(() => {
    // Prioritize custom thumbnail if available
    if (post.content.thumbnailUrl) {
      setThumbnail(post.content.thumbnailUrl);
      return;
    }

    const video = thumbnailVideoRef.current;
    if (post.content.mediaUrls?.[0] && video) {
      
      const handleLoadedData = () => {
        if (video.duration) {
          video.currentTime = video.duration / 2; // Seek to the middle
        }
      };
      
      const handleSeeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
          setThumbnail(thumbnailUrl);
        }
      };
      
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('seeked', handleSeeked);
      
      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('seeked', handleSeeked);
      };
    }
  }, [post.content.mediaUrls, post.content.thumbnailUrl]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({ title: "Please sign in to like posts", variant: "destructive" });
      return;
    }
    try {
      const { liked, likesCount } = await toggleLike(post.id, user.uid);
      setIsLiked(liked);
      setLikes(likesCount);
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({ title: "Failed to like post", variant: "destructive" });
    }
  };

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

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast({ title: "Coming Soon", description: "Commenting functionality will be available soon."});
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast({ title: "Coming Soon", description: "Sharing functionality will be available soon."});
  };
  
  const cardStyle = {
    backgroundImage: `url(${thumbnail})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play().catch(err => console.error('Error playing video:', err));
            if (user && post.id && post.communityId) {
              recordInteraction({ userId: user.uid, postId: post.id, communityId: post.communityId, interactionType: 'play', mediaType: 'video' });
            }
        }
    } else {
        setIsPlaying(true);
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

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [isPlaying]);

  return (
    <>
        {/* Hidden video for thumbnail extraction */}
        {post.content.mediaUrls?.[0] && !post.content.thumbnailUrl && (
          <video
            ref={thumbnailVideoRef}
            src={post.content.mediaUrls[0]}
            className="hidden"
            preload="metadata"
            muted
            crossOrigin="anonymous"
          />
        )}
        
        <div className="relative bg-neutral-900 overflow-hidden shadow-md group cursor-pointer transition-all duration-300 hover:shadow-xl ease-in-out hover:scale-[1.02] min-h-[400px] rounded-3xl" style={cardStyle}>
        {/* Black overlay */}
        <div className="absolute inset-0 bg-black/50" />
        
        {isPostCreator && (
            <div className="absolute top-2 right-2 flex gap-1 z-30">
                <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 hover:bg-white rounded-full" onClick={(e) => {e.stopPropagation(); post._onEdit?.()}}>
                    <Edit className="h-4 w-4 text-gray-700" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 hover:bg-white rounded-full" onClick={(e) => {e.stopPropagation(); setShowDeleteDialog(true)}}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
            </div>
        )}
        
        {isPlaying && post.content.mediaUrls?.[0] ? (
            <video 
                ref={videoRef}
                src={post.content.mediaUrls[0]}
                className="absolute inset-0 w-full h-full object-cover z-20"
                autoPlay
                controls
                poster={thumbnail}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                onEnded={handleVideoEnded}
            />
        ) : null}

        <div className="relative z-10 p-4 md:p-6 flex flex-col justify-between h-full min-h-[400px]">
            <div className="flex justify-between items-start">
                <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider bg-[#F0C679] text-black rounded-full font-medium">
                  Watch
                </span>
                {isPrivate && (
                    <div className="bg-red-500 rounded-full p-2 shadow-lg">
                        <Lock className="w-4 h-4 text-white" />
                    </div>
                )}
            </div>
            
            <div className="space-y-3">
                <h2 className="text-white text-2xl md:text-3xl drop-shadow-lg" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", fontWeight: 500, textTransform: 'capitalize', letterSpacing: '0.02em' }}>
                    {title}
                </h2>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={togglePlayPause} 
                        className="w-12 h-12 rounded-full bg-[#F0C679] flex items-center justify-center text-black hover:bg-[#E5B960] transition-colors flex-shrink-0"
                    >
                        {isPlaying ? <Pause className="h-5 w-5"/> : <Play className="w-5 h-5 ml-0.5" />}
                    </button>
                    
                    <div className="flex-1 space-y-1">
                        <div className="text-white text-sm font-medium">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                        <div className="w-full h-1.5 bg-gray-600 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-[#F0C679] transition-all duration-200"
                                style={{ width: `${progress}%` }}
                            />
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
}
