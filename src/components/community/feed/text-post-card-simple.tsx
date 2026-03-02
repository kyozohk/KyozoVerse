'use client';

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type Post } from "@/lib/types";
import Image from "next/image";

interface TextPostCardProps {
  post: Post & { id: string };
}

export const TextPostCardSimple: React.FC<TextPostCardProps> = ({ post }) => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const handleDelete = async () => {
    if (!post.id) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch('/api/posts/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post.id,
          mediaUrls: post.content.mediaUrls || [],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete post');
      }

      toast({
        title: "Post deleted",
        description: "The post has been successfully deleted.",
      });
      setShowDeleteDialog(false);
      
      // Refresh the page to show updated feed
      window.location.reload();
    } catch (error: any) {
      console.error("Error deleting post:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const hasImage = post.content.mediaUrls && post.content.mediaUrls.length > 0;
  const formattedDate = post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '00/00/00';
  const readTime = `${Math.max(1, Math.ceil((post.content.text?.length || 0) / 1000))} min read`;
  
  return (
    <>
      <div className="relative overflow-hidden rounded-lg shadow-lg transition-all hover:shadow-xl bg-gradient-to-br from-purple-50 to-pink-50">
        {/* DELETE BUTTON - ALWAYS VISIBLE */}
        <button
          onClick={() => setShowDeleteDialog(true)}
          className="absolute top-4 right-4 z-50 h-10 w-10 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
          title="Delete post"
        >
          <Trash2 className="h-5 w-5 text-white" />
        </button>
        
        <div className="p-6">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="bg-[#C170CF] text-white px-4 py-1 rounded-full text-sm font-medium">Read</span>
            <span className="bg-transparent border border-[#C170CF] text-[#C170CF] px-4 py-1 rounded-full text-sm">
              {(post.content.text?.length || 0) > 1000 ? 'Long form article' : 'Short form'}
            </span>
          </div>
          
          {/* Title */}
          <h2 className="text-slate-800 text-2xl font-medium mb-3">{post.title}</h2>
          
          {/* Image */}
          {hasImage && (
            <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
              <Image 
                src={post.content.mediaUrls![0]} 
                alt={post.title || "Post image"} 
                fill 
                className="object-cover"
              />
            </div>
          )}
          
          {/* Content */}
          <p className="text-slate-700 mb-4">{post.content.text}</p>
          
          {/* Footer */}
          <div className="pt-4 border-t border-slate-200">
            <span className="text-slate-600 text-sm">{formattedDate} • {readTime}</span>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowDeleteDialog(false)} />
          <div className="relative bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Are you sure?</h3>
            <p className="text-gray-600 mb-6">
              This action cannot be undone. This will permanently delete the post "{post.title}" and remove the data from our servers.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
