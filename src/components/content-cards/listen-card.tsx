
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Play, Lock, ThumbsUp, MessageSquare, Share2, Pause, Edit, Trash2 } from 'lucide-react';
import { Button } from '../ui';
import { Post } from '@/lib/types';
import { useCommunityAuth } from '@/hooks/use-community-auth';
import { toggleLike, recordInteraction } from '@/lib/interaction-utils';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { deletePost } from '@/lib/post-utils';

interface ListenCardProps {
  category: string;
  episode: string;
  duration: string;
  title: string;
  summary?: string;
  isPrivate?: boolean;
  post: Post & { id: string; _isPublicView?: boolean; _onEdit?: () => void; _canEdit?: boolean };
}

// Waveform component
const Waveform = ({ isPlaying, currentTime, duration }: { isPlaying: boolean, currentTime: number, duration: number }) => {
    const [heights, setHeights] = useState<number[]>([]);
    const barCount = 80;

    useEffect(() => {
        const generateHeights = () => {
            return Array.from({ length: barCount }, () => 20 + Math.random() * 80);
        };
        setHeights(generateHeights());
    }, []);
    
    const playedBars = Math.floor((currentTime / duration) * barCount);

    return (
        <div className="flex items-center gap-[2px] h-16 md:h-20 lg:h-24 cursor-pointer">
            {heights.map((height, index) => (
                <div
                    key={index}
                    className="flex-1 transition-all duration-75 rounded-full"
                    style={{
                        height: `${height}%`,
                        backgroundColor: index < playedBars ? '#3B82F6' : '#DBEAFE',
                        minWidth: '3px'
                    }}
                />
            ))}
        </div>
    );
};

export function ListenCard({ category, episode, duration: initialDuration, title, summary, isPrivate, post }: ListenCardProps) {
  const { user } = useCommunityAuth();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(post?.likes ?? 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const isPostCreator = user && !post._isPublicView && (post.authorId === user.uid || post._canEdit);
  const audioRef = useRef<HTMLAudioElement>(null);

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

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

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast({ title: "Coming Soon", description: "Commenting functionality will be available soon."});
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast({ title: "Coming Soon", description: "Sharing functionality will be available soon."});
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(err => console.error('Error playing audio:', err));
        if (user && post.id && post.communityId) {
          recordInteraction({ userId: user.uid, postId: post.id, communityId: post.communityId, interactionType: 'play', mediaType: 'audio' });
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => audioRef.current && setCurrentTime(audioRef.current.currentTime);
  const handleLoadedMetadata = () => audioRef.current && setDuration(audioRef.current.duration);
  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
    if (user && post.id && post.communityId) {
      recordInteraction({ userId: user.uid, postId: post.id, communityId: post.communityId, interactionType: 'finish', mediaType: 'audio', playDurationSeconds: duration });
    }
  };
  
  const cardStyle = {
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.1'/%3E%3C/svg%3E\")",
    backgroundColor: 'rgb(245, 241, 232)'
  };
  const innerDivStyle = {
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E\")"
  };

  return (
    <>
      <div className="bg-white overflow-hidden shadow-md cursor-pointer relative group cursor-pointer transition-all duration-300 hover:shadow-xl ease-in-out hover:scale-[1.02] rounded-lg" style={cardStyle}>
        {isPrivate && (
          <div className="absolute top-4 right-4 z-10"><div className="bg-red-500 rounded-full p-2 shadow-lg"><Lock className="w-4 h-4 text-white" /></div></div>
        )}
        {isPostCreator && (
            <div className="absolute top-2 right-2 flex gap-1 z-20">
                <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 hover:bg-white rounded-full" onClick={(e) => {e.stopPropagation(); post._onEdit?.()}}>
                    <Edit className="h-4 w-4 text-gray-700" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 hover:bg-white rounded-full" onClick={(e) => {e.stopPropagation(); setShowDeleteDialog(true)}}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
            </div>
        )}
        <div className="p-4 md:p-6 lg:p-8 h-full flex flex-col justify-between" style={innerDivStyle}>
          <div className="flex flex-col gap-3 md:gap-4 lg:gap-6">
            <div className="flex flex-col gap-2 md:gap-3 lg:gap-5">
              <div className="flex items-center gap-2 md:gap-2.5">
                <span className="px-2 py-1 md:px-2.5 md:py-1.5 text-[10px] md:text-xs uppercase tracking-wide bg-blue-100 text-blue-600 rounded-full shadow-md">
                  {category}
                </span>
                <p className="text-neutral-500 uppercase tracking-[0.3px] text-[10px] md:text-xs leading-4">
                  {episode} • {formatTime(duration)}
                </p>
              </div>
              <h2 className="text-[#4F5B66] leading-[1.1] text-2xl md:text-3xl lg:text-4xl" style={{ letterSpacing: '-1.5px', fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 600 }}>
                {title}
              </h2>
              {summary && <p className="text-[#504c4c] leading-relaxed text-sm md:text-base lg:text-lg">{summary}</p>}
            </div>
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center gap-3 md:gap-4">
                <button onClick={togglePlayPause} className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition-all shadow-lg flex-shrink-0">
                  {isPlaying ? <Pause className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-white" /> : <Play className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-white ml-1" />}
                </button>
                <div className="flex-1">
                  <Waveform isPlaying={isPlaying} currentTime={currentTime} duration={duration} />
                  <div className="flex items-center justify-between mt-2 md:mt-3">
                    <span className="text-neutral-600 text-xs md:text-sm">{formatTime(currentTime)}</span>
                    <span className="text-neutral-600 text-xs md:text-sm">{formatTime(duration)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-start gap-2 pt-4">
              <Button variant="ghost" size="sm" className="flex items-center gap-1 text-gray-600" onClick={handleLike}>
                  <ThumbsUp className={`h-4 w-4 ${isLiked ? 'text-primary' : ''}`} />
                  <span>{likes}</span>
              </Button>
              <Button variant="ghost" size="sm" className="flex items-center gap-1 text-gray-600" onClick={handleComment}>
                  <MessageSquare className="h-4 w-4" />
                  <span>{post.comments || 0}</span>
              </Button>
              <Button variant="ghost" size="sm" className="flex items-center gap-1 text-gray-600" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <audio 
            ref={audioRef} 
            src={post.content.mediaUrls?.[0]} 
            className="hidden"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleAudioEnded}
        />
      </div>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your audio post.
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
