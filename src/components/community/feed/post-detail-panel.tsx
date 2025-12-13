'use client';

import { X } from 'lucide-react';
import { type Post } from '@/lib/types';
import { TextPostCard } from './text-post-card';
import { AudioPostCard } from './audio-post-card';
import { VideoPostCard } from './video-post-card';

interface PostDetailPanelProps {
  post: (Post & { id: string }) | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PostDetailPanel({ post, isOpen, onClose }: PostDetailPanelProps) {
  if (!post) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Slide-in Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[600px] lg:w-[700px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header with close button */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {post.type === 'text' || post.type === 'image' ? 'Read' : 
             post.type === 'audio' ? 'Listen' : 
             post.type === 'video' ? 'Watch' : 'View'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Render the appropriate card component */}
          {(post.type === 'text' || post.type === 'image') && (
            <TextPostCard post={post} />
          )}
          {post.type === 'audio' && (
            <AudioPostCard post={post} />
          )}
          {post.type === 'video' && (
            <VideoPostCard post={post} />
          )}
        </div>
      </div>
    </>
  );
}
