
'use client';

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThumbsUp, MessageSquare, Share2, ArrowRight, Edit, Trash2, Lock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { deletePost } from "@/lib/post-utils";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { type Post } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface TextPostCardProps {
  post: Post & { id: string; _isPublicView?: boolean; _onEdit?: () => void; _canEdit?: boolean };
}

export const TextPostCard: React.FC<TextPostCardProps> = ({ post }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    // Show edit/delete options if:
    // 1. User is logged in AND is the post creator, OR
    // 2. _canEdit flag is explicitly set (for owners/admins)
    // Never show in public view (_isPublicView flag)
    const isPostCreator = user && !post._isPublicView && (post.authorId === user.uid || post._canEdit);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    
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
    const hasImage = post.content.mediaUrls && post.content.mediaUrls.length > 0;
    
    // Debug logging for image URLs
    if (hasImage) {
        console.log('Post has image URL:', post.content.mediaUrls![0]);
    }
    
    // Format date if available
    const formattedDate = post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '00/00/00';
    // Estimate read time based on content length
    const readTime = `${Math.max(1, Math.ceil((post.content.text?.length || 0) / 1000))} min read`;
    
    return (
        <>
            <div className="relative overflow-hidden rounded-lg shadow-lg transition-all hover:shadow-xl">
                {/* Background Image */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-50 to-pink-50 z-0" />
                
                {/* Edit/Delete buttons for post creator */}
                {isPostCreator && (
                    <div className="absolute top-2 right-2 flex gap-1 z-20">
                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 hover:bg-white rounded-full" onClick={() => post._onEdit?.()}>
                            <Edit className="h-4 w-4 text-gray-700" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 hover:bg-white rounded-full" onClick={() => setShowDeleteDialog(true)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                    </div>
                )}
                
                <div className={cn(
                    "relative z-10 flex flex-col",
                    hasImage ? "md:flex-row" : "flex-col"
                )}>
                    {/* Image section */}
                    {hasImage && (
                        <div className="w-full md:w-1/3 p-4">
                            <div className="relative aspect-square rounded-lg overflow-hidden">
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
                        </div>
                    )}
                    
                    {/* Content section */}
                    <div className={cn(
                        "p-6 flex flex-col h-full",
                        hasImage ? "md:w-2/3" : "w-full"
                    )}>
                        {/* Top badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            <span className="bg-[#C170CF] text-white px-4 py-1 rounded-full text-sm font-medium">Read</span>
                            <span className="bg-transparent border border-[#C170CF] text-[#C170CF] px-4 py-1 rounded-full text-sm">
                                {post.content.text?.length > 1000 ? 'Long form article' : 'Short form'}
                            </span>
                            {post.visibility === 'private' && (
                                <span className="text-xs font-semibold rounded-full px-3 py-1 bg-gray-200 text-gray-700 inline-flex items-center gap-1">
                                    <Lock className="h-3 w-3" /> Private
                                </span>
                            )}
                        </div>
                        
                        {/* Title */}
                        <h2 className="text-slate-800 text-2xl font-medium mb-3">{post.title}</h2>
                        
                        {/* Content */}
                        <div className="flex-grow">
                            <p className="text-slate-700">{post.content.text}</p>
                        </div>
                        
                        {/* Footer */}
                        <div className="mt-auto pt-4 border-t border-slate-200">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600 text-sm">{formattedDate} • {readTime}</span>
                                
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500 font-medium">READ</span>
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-500">
                                        <ArrowRight className="h-4 w-4 text-white" />
                                    </div>
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
                            This action cannot be undone. This will permanently delete your post
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
