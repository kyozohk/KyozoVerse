
'use client';

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThumbsUp, MessageSquare, Share2, ArrowRight, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { deletePost } from "@/lib/post-utils";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { type Post } from "@/lib/types";
import Image from "next/image";

interface TextPostCardProps {
  post: Post & { id: string };
}

export const TextPostCard: React.FC<TextPostCardProps> = ({ post }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const isPostCreator = user && post.authorId === user.uid;
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
    
    // Always use the text-specific background, even for posts with images
    const backgroundStyle = { 
        backgroundImage: `url('/bg/text_bg.png')`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center' 
    };

    return (
        <Card 
            className="overflow-hidden shadow-lg transition-all hover:border-primary/50 relative"
            style={backgroundStyle}
        >
            {isPostCreator && (
                <div className="absolute top-2 right-2 flex gap-1 z-10">
                    <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 hover:bg-white rounded-full">
                        <Edit className="h-4 w-4 text-gray-700" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 bg-white/80 hover:bg-white rounded-full"
                        onClick={() => setShowDeleteDialog(true)}
                        disabled={isDeleting}
                    >
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </div>
            )}
        <div className="flex flex-col md:flex-row">
            {hasImage && (
                <div className="w-full md:w-1/3 h-48 md:h-auto overflow-hidden relative">
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
            <div className={`p-6 flex flex-col justify-between w-full ${hasImage ? 'md:w-2/3' : ''} text-black`}>
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold rounded-full px-2 py-1 bg-primary text-white">Read</span>
                        <span className="text-xs text-muted-foreground">Short form</span>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">{post.title}</h2>
                    <p className="text-base mb-4">{post.content.text}</p>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>00/00/00 - 8 min read</span>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        <span>READ</span>
                        <ArrowRight className="h-4 w-4" />
                    </Button>
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
        </Card>
    );
};
