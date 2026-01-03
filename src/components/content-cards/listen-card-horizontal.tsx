
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

interface ListenCardHorizontalProps {
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
    const barCount = 100;

    useEffect(() => {
        const generateHeights = () => {
            return Array.from({ length: barCount }, () => 20 + Math.random() * 80);
        };
        setHeights(generateHeights());
    }, []);
    
    const playedBars = Math.floor((currentTime / duration) * barCount);

    return (
        <div className="flex items-center gap-[2px] h-16 cursor-pointer">
            {heights.map((height, index) => (
                <div
                    key={index}
                    className="flex-1 transition-all duration-75 rounded-full"
                    style={{
                        height: `${height}%`,
                        backgroundColor: index < playedBars ? '#6E94B1' : '#CCCCCC',
                        minWidth: '2px'
                    }}
                />
            ))}
        </div>
    );
};

export function ListenCardHorizontal({ category, episode, duration: initialDuration, title, summary, isPrivate, post }: ListenCardHorizontalProps) {
  const { user } = useCommunityAuth();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(post?.likes ?? 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isPostCreator = user && !post._isPublicView && (post.authorId === user.uid || post._canEdit);

  useEffect(() => {
    if (audioRef.current) {
      const currentAudio = audioRef.current;
      currentAudio.addEventListener('loadedmetadata', handleLoadedMetadata);
      currentAudio.addEventListener('timeupdate', handleTimeUpdate);
      currentAudio.addEventListener('ended', handleAudioEnded);
    
      return () => {
        currentAudio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        currentAudio.removeEventListener('timeupdate', handleTimeUpdate);
        currentAudio.removeEventListener('ended', handleAudioEnded);
      };
    }
  }, []);

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
        if (user && post.id && post.communityId) {
          recordInteraction({ userId: user.uid, postId: post.id, communityId: post.communityId, interactionType: 'play', mediaType: 'audio' });
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({ title: "Please sign in to like posts", variant: "destructive" });
      return;
    }
    try {
      await toggleLike({ userId: user.uid, postId: post.id, communityId: post.communityId || '' });
      setIsLiked(!isLiked);
      setLikes(isLiked ? likes - 1 : likes + 1);
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({ title: "Failed to like post", variant: "destructive" });
    }
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast({ title: "Comments coming soon!" });
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast({ title: "Share functionality coming soon!" });
  };

  const handleDelete = async () => {
    try {
      await deletePost(post.id);
      toast({ title: "Post deleted successfully" });
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({ title: "Failed to delete post", variant: "destructive" });
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
      <div className="bg-white overflow-hidden shadow-md cursor-pointer relative group transition-all duration-300 hover:shadow-xl ease-in-out hover:scale-[1.02] rounded-3xl" style={cardStyle}>
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
        <div className="p-6 h-full flex items-center gap-8" style={innerDivStyle}>
          {/* Left side - Title (40% width) */}
          <div className="w-[40%] flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-xs uppercase tracking-wide bg-[#6E94B1] text-white rounded-full font-medium">
                {category}
              </span>
              <p className="text-neutral-500 uppercase tracking-wide text-xs">
                {episode} • {formatTime(duration)}
              </p>
            </div>
            <h2 className="text-[#2d3748] leading-tight text-2xl font-bold">
              {title}
            </h2>
          </div>
          
          {/* Right side - Playback controls (60% width) */}
          <div className="flex-1 flex items-center gap-4">
            <button onClick={togglePlayPause} className="w-14 h-14 rounded-full bg-[#6E94B1] hover:bg-blue-600 flex items-center justify-center transition-all shadow-lg flex-shrink-0">
              {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-1" />}
            </button>
            <div className="flex-1">
              <Waveform isPlaying={isPlaying} currentTime={currentTime} duration={duration} />
            </div>
          </div>
        </div>
        <audio 
            ref={audioRef} 
            src={post.content.mediaUrls?.[0]} 
            className="hidden"
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
                  <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                      Delete
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
