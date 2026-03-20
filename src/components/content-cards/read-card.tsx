
'use client';

import React, { useState } from 'react';
import { Lock, ThumbsUp, MessageSquare, Share2, ArrowRight, Edit, Trash2, Heart } from 'lucide-react';
import { Button } from '../ui';
import { Post } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { toggleLike } from '@/lib/interaction-utils';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { cardTitleStyle, cardBodyStyle, CARD_TITLE_COLOR, CARD_BODY_COLOR } from './card-styles';

interface ReadCardProps {
  post: Post & { id: string; _isPublicView?: boolean; _onEdit?: () => void; _canEdit?: boolean };
  category: string;
  readTime: string;
  date?: string;
  title: string;
  summary?: string;
  isPrivate?: boolean;
}

export function ReadCard({ post, category, readTime, date, title, summary, isPrivate }: ReadCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes || 0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const isPostCreator = post._canEdit || (user && !post._isPublicView && post.authorId === user.uid);
  
  const handleDelete = async () => {
    if (!post.id || !user) return;
    setIsDeleting(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/posts/delete', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ 
          postId: post.id, 
          mediaUrls: post.content.mediaUrls,
          thumbnailUrl: post.content.thumbnailUrl
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete post');
      }
      
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
  
  const cardStyle = {
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
    backgroundColor: 'rgb(245, 241, 232)'
  };
  const innerDivStyle = {
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E\")"
  };

  const imageUrl = post.content.mediaUrls?.[0];

  return (
    <>
      <div className="bg-white overflow-hidden shadow-md cursor-pointer relative group transition-all duration-300 hover:shadow-xl ease-in-out hover:scale-[1.02] rounded-3xl" style={cardStyle}>
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
        <div className="h-full flex flex-col" style={innerDivStyle}>
          {/* Category badge and metadata at top */}
          <div className="p-4 md:p-6 lg:p-8 pb-0">
            <div className="flex items-center gap-2 md:gap-2.5">
              <span className="px-3 py-1 text-xs uppercase tracking-wide bg-[#926B7F] text-white rounded-full font-medium">
                {category}
              </span>
              <p className="text-neutral-500 uppercase tracking-wide text-xs">
                {readTime} {date && `• ${date}`}
              </p>
              {post.visibility === 'private' && (
                <span className="text-xs font-semibold rounded-full px-2 py-1 bg-red-100 text-red-600 inline-flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Private
                </span>
              )}
            </div>
          </div>
          
          {/* Image if present */}
          {imageUrl && (
            <div className="relative w-full aspect-video overflow-hidden mt-4 mx-4 md:mx-6 lg:mx-8 rounded-xl">
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-cover"
              />
            </div>
          )}
          
          {/* Content section */}
          <div className="p-4 md:p-6 lg:p-8 flex-grow flex flex-col justify-between">
            <div className="flex flex-col gap-3 md:gap-4 lg:gap-6">
              <h2 className="text-4xl font-black" style={{ ...cardTitleStyle, color: CARD_TITLE_COLOR }}>
                {title}
              </h2>
              {summary && <p className="text-sm md:text-base line-clamp-3" style={{ ...cardBodyStyle, color: CARD_BODY_COLOR }}>{summary}</p>}
            </div>
            {/* Engagement buttons */}
            <div className="flex items-center gap-4 pt-3 border-t border-neutral-200 mt-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (user) {
                    toggleLike(post.id, user.uid).then(({ liked, likesCount }) => {
                      setIsLiked(liked);
                      setLikes(likesCount);
                    });
                  }
                }}
                className={cn("flex items-center gap-1.5 text-sm transition-colors", isLiked ? "text-red-500" : "text-neutral-500 hover:text-red-500")}
              >
                <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                <span>{likes}</span>
              </button>
              <button type="button" className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-blue-500 transition-colors" onClick={(e) => { e.stopPropagation(); toast({ title: 'Comments', description: 'Comment section coming soon!' }); }}>
                <MessageSquare className="h-4 w-4" />
                <span>{post.comments || 0}</span>
              </button>
              <button type="button" className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-green-500 transition-colors" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(window.location.href); toast({ title: 'Link copied!', description: 'Post link copied to clipboard.' }); }}>
                <Share2 className="h-4 w-4" />
              </button>
            </div>

            <div className="pt-4 md:pt-5 lg:pt-7 flex-shrink-0">
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Open post in expanded view or scroll to top with full content
                    const el = e.currentTarget.closest('[data-post-id]');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                    toast({ title: title, description: summary?.substring(0, 100) || 'Full article view coming soon.' });
                  }}
                  className="text-[#504c4c] hover:text-neutral-700 transition-colors uppercase tracking-[0.35px] text-xs md:text-sm cursor-pointer hover:underline"
                >
                  Read Full Article →
                </button>
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
