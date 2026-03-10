'use client';

import { useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X, Edit, Trash2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type Post } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PostDetailDialogProps {
  post: (Post & { id: string; _canEdit?: boolean }) | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function PostDetailDialog({ post, isOpen, onClose, onEdit, onDelete }: PostDetailDialogProps) {
  console.log('🔍 POST DETAIL DIALOG: rendered', { isOpen, postId: post?.id, postType: post?.type });
  if (!post) return null;

  const date = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '';

  const renderMedia = () => {
    switch (post.type) {
      case 'image':
        return post.content.mediaUrls?.[0] ? (
          <img
            src={post.content.mediaUrls[0]}
            alt={post.title || ''}
            className="w-full rounded-xl object-cover max-h-[420px]"
          />
        ) : null;
      case 'audio':
        return post.content.mediaUrls?.[0] ? (
          <div className="bg-[#f5f0e8] rounded-xl p-6">
            <audio controls className="w-full">
              <source src={post.content.mediaUrls[0]} />
              Your browser does not support audio playback.
            </audio>
          </div>
        ) : null;
      case 'video':
        return post.content.mediaUrls?.[0] ? (
          <div className="rounded-xl overflow-hidden bg-black">
            <video
              controls
              className="w-full max-h-[420px]"
              poster={post.content.thumbnailUrl || undefined}
            >
              <source src={post.content.mediaUrls[0]} />
              Your browser does not support video playback.
            </video>
          </div>
        ) : null;
      default:
        return post.content.mediaUrls?.[0] ? (
          <img
            src={post.content.mediaUrls[0]}
            alt={post.title || ''}
            className="w-full rounded-xl object-cover max-h-[320px]"
          />
        ) : null;
    }
  };

  useEffect(() => {
    console.log('🔍 POST DETAIL DIALOG: DialogPrimitive.Root mounted', { isOpen });
  }, [isOpen]);

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
            "w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl shadow-2xl",
            "bg-white focus:outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
            "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
          )}
        >
          {/* Sticky header */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full text-white" style={{ backgroundColor: '#6B5D52' }}>
                {post.type === 'audio' ? 'Listen' : post.type === 'video' ? 'Watch' : 'Read'}
              </span>
              {post.visibility === 'private' && (
                <span className="flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  <Lock className="h-3 w-3" /> Private
                </span>
              )}
              {date && <span className="text-xs text-gray-400">{date}</span>}
            </div>
            <div className="flex items-center gap-1">
              {post._canEdit && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-gray-100"
                    onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
                    title="Edit post"
                  >
                    <Edit className="h-4 w-4 text-gray-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-red-50"
                    onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                    title="Delete post"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-gray-100 ml-1"
                onClick={onClose}
              >
                <X className="h-4 w-4 text-gray-500" />
              </Button>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="px-8 py-6 space-y-6">
              {/* Title */}
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                {post.title || 'Untitled'}
              </h1>

              {/* Author + meta */}
              {post.author?.displayName && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>by <strong className="text-gray-700">{post.author.displayName}</strong></span>
                </div>
              )}

              {/* Media */}
              {renderMedia()}

              {/* Body text */}
              {post.content.text && (
                <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {post.content.text}
                </div>
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
