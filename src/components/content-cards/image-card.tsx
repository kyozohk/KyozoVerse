
'use client';
import React, { useState } from 'react';
import { Lock, ThumbsUp, MessageSquare, Share2, Edit, Trash2 } from 'lucide-react';
import { Button } from '../ui';
import { Post } from '@/lib/types';
import { useCommunityAuth } from '@/hooks/use-community-auth';
import { toggleLike } from '@/lib/interaction-utils';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { deletePost } from '@/lib/post-utils';

interface ImageCardProps {
  category: string;
  readTime: string;
  date: string;
  title: string;
  summary?: string;
  imageUrl: string;
  isPrivate?: boolean;
  post: Post & { id: string; _isPublicView?: boolean; _onEdit?: () => void; _canEdit?: boolean };
}

export function ImageCard({ category, readTime, date, title, summary, imageUrl, isPrivate, post }: ImageCardProps) {
  const { user } = useCommunityAuth();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(post?.likes ?? 0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const isPostCreator = user && !post._isPublicView && (post.authorId === user.uid || post._canEdit);

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
  
  const cardStyle = {
    backgroundImage: `url(${imageUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  return (
    <>
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
        
        {/* Content overlay */}
        <div className="relative z-10 p-6 flex flex-col h-full min-h-[400px]">
          <div className="flex justify-between items-start mb-4">
            <span className="px-3 py-1 text-xs uppercase tracking-wide bg-[#926B7F] text-white rounded-full font-medium">
              {category}
            </span>
            {isPrivate && (
              <div className="bg-red-500 rounded-full p-2 shadow-lg">
                <Lock className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <h2 className="text-white font-semibold uppercase tracking-wide text-2xl mb-3 drop-shadow-lg" style={{ letterSpacing: '0.045em' }}>
              {title}
            </h2>
            {summary && (
              <p className="text-white/90 text-sm mb-4 line-clamp-3 drop-shadow-md" style={{ fontWeight: 400, lineHeight: 1.6 }}>
                {summary}
              </p>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="flex items-center gap-1 text-white hover:bg-white/20" onClick={handleLike}>
                <ThumbsUp className={`h-4 w-4 ${isLiked ? 'text-pink-400' : ''}`} />
                <span>{likes}</span>
              </Button>
              <Button variant="ghost" size="sm" className="flex items-center gap-1 text-white hover:bg-white/20" onClick={handleComment}>
                <MessageSquare className="h-4 w-4" />
                <span>{post.comments || 0}</span>
              </Button>
              <Button variant="ghost" size="sm" className="flex items-center gap-1 text-white hover:bg-white/20" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your image post.
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
