
'use client';

import React, { useState } from 'react';
import { Lock, ThumbsUp, MessageSquare, Share2, ArrowRight, Edit, Trash2 } from 'lucide-react';
import { Button } from '../ui';
import { Post } from '@/lib/types';
import { useCommunityAuth } from '@/hooks/use-community-auth';
import { toggleLike } from '@/lib/interaction-utils';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { deletePost } from '@/lib/post-utils';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ReadCardProps {
  post: Post & { id: string; _isPublicView?: boolean; _onEdit?: () => void; _canEdit?: boolean };
  category: string;
  readTime: string;
  date?: string;
  title: string;
  summary?: string;
  fullText?: string;
  titleColor?: string;
  isPrivate?: boolean;
}

export function ReadCard({ post, category, readTime, date, title, summary, fullText, titleColor = '#504c4c', isPrivate }: ReadCardProps) {
  const { user } = useCommunityAuth();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes || 0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const isPostCreator = user && !post._isPublicView && (post.authorId === user.uid || post._canEdit);
  const hasImage = post.content.mediaUrls && post.content.mediaUrls.length > 0;

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
            description: "Your post has been successfully deleted.",
        });
    } catch (error) {
        console.error("Error deleting post:", error);
        toast({
            title: "Error",
            description: "Failed to delete post. Please try again.",
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
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
    backgroundColor: 'rgb(245, 241, 232)'
  };
  const innerDivStyle = {
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E\")"
  };

  return (
    <>
      <div className="bg-white overflow-hidden shadow-md cursor-pointer relative group transition-all duration-300 hover:shadow-xl ease-in-out hover:scale-[1.02] rounded-lg" style={cardStyle}>
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
        {hasImage && (
          <div className="relative w-full aspect-video">
            <Image 
              src={post.content.mediaUrls![0]} 
              alt={post.title || "Post image"} 
              fill 
              className="object-cover"
              onLoad={() => console.log('Image loaded successfully:', post.content.mediaUrls![0])}
              onError={() => {
                console.error('Image failed to load:', post.content.mediaUrls![0]);
              }}
            />
          </div>
        )}
        <div className="p-4 md:p-6 lg:p-8 h-full flex flex-col justify-between" style={innerDivStyle}>
          <div className="flex flex-col gap-3 md:gap-4 lg:gap-6">
            <div className="flex flex-col gap-2 md:gap-3 lg:gap-5">
              <div className="flex items-center gap-2 md:gap-2.5">
                <span className="px-2 py-1 md:px-2.5 md:py-1.5 text-[10px] md:text-xs uppercase tracking-wide bg-[#D946A6] text-white rounded-full shadow-md opacity-50">
                  {category}
                </span>
                <p className="text-neutral-500 uppercase tracking-[0.3px] text-[10px] md:text-xs leading-4">
                  {readTime} {date && `• ${date}`}
                </p>
                {post.visibility === 'private' && (
                  <span className="text-xs font-semibold rounded-full px-2 py-1 bg-red-100 text-red-600 inline-flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Private
                  </span>
                )}
              </div>
              <h2 className="leading-[1.1] text-2xl md:text-4xl lg:text-5xl" style={{ letterSpacing: '-1.5px', fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 600, color: titleColor }}>
                {title}
              </h2>
            </div>
            {summary && <p className="text-[#504c4c] leading-relaxed text-sm md:text-base lg:text-lg italic line-clamp-3">{summary}</p>}
            {fullText && <p className="text-[#504c4c] leading-relaxed text-sm md:text-base line-clamp-3">{fullText}</p>}
          </div>
          <div className="pt-4 md:pt-5 lg:pt-7 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
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
              <span className="text-[#504c4c] hover:text-neutral-700 transition-colors uppercase tracking-[0.35px] text-xs md:text-sm">Read Full Article →</span>
            </div>
          </div>
        </div>
      </div>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your post.
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
