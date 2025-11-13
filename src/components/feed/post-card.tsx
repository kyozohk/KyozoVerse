"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { ThumbsUp, MessageSquare, Share2, Clock, Download, Edit, Trash2 } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { type Post, type User } from "@/lib/types";

interface PostCardProps {
  post: Post & { id: string };
  author?: User;
}

export function PostCard({ post, author }: PostCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const { user } = useAuth();
  const isPostCreator = user && post.authorId === user.uid;
  
  const isTextPost = post.type === "text" && (!post.content.mediaUrls || post.content.mediaUrls.length === 0);
  const isImagePost = post.type === "image" || (post.content.mediaUrls && post.content.mediaUrls.length > 0 && !post.type.match(/audio|video/));
  const isAudioPost = post.type === "audio";
  const isVideoPost = post.type === "video";
  
  const handlePlayAudio = (audioRef: HTMLAudioElement) => {
    if (isPlaying) {
      audioRef.pause();
    } else {
      audioRef.play();
    }
    setIsPlaying(!isPlaying);
  };
  
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };
  
  const formatReadTime = (minutes: number) => {
    return `${minutes} min read`;
  };
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getCardClass = () => {
    if (isTextPost) return "bg-[#C170CF]/10 border-[#C170CF]/30";
    if (isAudioPost) return "bg-[#699FE5]/10 border-[#699FE5]/30";
    if (isVideoPost) return "bg-[#CF7770]/10 border-[#CF7770]/30";
    return "";
  };
  
  const getPostTypeLabel = () => {
    if (isTextPost) return { label: "Post", color: "bg-[#C170CF]" };
    if (isImagePost) return { label: "Long form article", color: "bg-[#C170CF]" };
    if (isAudioPost) return { label: "Listen", color: "bg-[#699FE5]" };
    if (isVideoPost) return { label: "Watch", color: "bg-[#CF7770]" };
    return { label: "Post", color: "bg-gray-500" };
  };
  
  const postTypeInfo = getPostTypeLabel();
  const postDate = post.createdAt ? new Date(post.createdAt) : new Date();
  const timeAgo = formatDistanceToNow(postDate, { addSuffix: true });
  
  return (
    <Card className={`overflow-hidden transition-all hover:border-primary/50 relative ${getCardClass()}`}>
      {isPostCreator && (
        <div className="absolute top-2 right-2 flex gap-1 z-10">
          <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 hover:bg-white rounded-full">
            <Edit className="h-4 w-4 text-gray-700" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 hover:bg-white rounded-full">
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      )}
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={author?.avatarUrl} />
            <AvatarFallback>{author?.displayName?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{author?.displayName || "Unknown User"}</p>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
        </div>
        
        <Badge className={`${postTypeInfo.color} text-white`}>
          {postTypeInfo.label}
        </Badge>
      </div>
      
      {/* Post Content */}
      <CardContent className="p-0">
        {/* Image Post */}
        {isImagePost && post.content.mediaUrls?.[0] && (
          <div className="relative">
            <img 
              src={post.content.mediaUrls[0]} 
              alt={post.title || "Post image"} 
              className="w-full object-cover max-h-[400px]"
              onError={(e) => {
                console.error('Image failed to load:', post.content.mediaUrls[0]);
                e.currentTarget.src = '/bg/image_placeholder.png';
              }}
            />
          </div>
        )}
        
        {/* Text Content */}
        <div className="p-4">
          <h3 className="text-xl font-bold mb-2">{post.title}</h3>
          
          {post.content.text && (
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              {post.content.text.length > 200 
                ? `${post.content.text.substring(0, 200)}...` 
                : post.content.text}
            </p>
          )}
          
          {/* Audio Player */}
          {isAudioPost && post.content.mediaUrls?.[0] && (
            <div className="mt-4 p-3 bg-[#699FE5]/20 rounded-md">
              <div className="flex items-center gap-3">
                <button 
                  onClick={(e) => {
                    const audioElement = e.currentTarget.nextElementSibling as HTMLAudioElement;
                    handlePlayAudio(audioElement);
                  }}
                  className="w-10 h-10 rounded-full bg-[#699FE5] text-white flex items-center justify-center"
                >
                  {isPlaying ? (
                    <span className="w-3 h-3 bg-white rounded-sm"></span>
                  ) : (
                    <svg width="10" height="12" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.5 5.13398C10.1667 5.51888 10.1667 6.48113 9.5 6.86603L1.5 11.4641C0.833334 11.849 0 11.3679 0 10.598L0 1.40192C0 0.632035 0.833333 0.150952 1.5 0.535898L9.5 5.13398Z" fill="white"/>
                    </svg>
                  )}
                </button>
                
                <audio 
                  src={post.content.mediaUrls[0]} 
                  onEnded={handleAudioEnded}
                  className="hidden"
                />
                
                <div className="flex-1">
                  <div className="h-1 bg-white rounded-full overflow-hidden">
                    <div className="h-full bg-[#699FE5]" style={{ width: isPlaying ? '100%' : '0%', transition: 'width 0.1s linear' }}></div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-600">
                    <span>{isPlaying ? "Playing..." : "Paused"}</span>
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {post.duration ? formatDuration(post.duration) : "00:00"}
                    </span>
                  </div>
                </div>
                
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Video Player */}
          {isVideoPost && post.content.mediaUrls?.[0] && (
            <div className="mt-4 rounded-md overflow-hidden">
              <video
                src={post.content.mediaUrls[0]}
                controls
                poster={post.thumbnailUrl}
                className="w-full aspect-video"
              />
            </div>
          )}
          
          {/* Post Meta */}
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            {post.readTime && (
              <span className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {formatReadTime(post.readTime)}
              </span>
            )}
            
            {post.duration && !isAudioPost && (
              <span className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {formatDuration(post.duration)}
              </span>
            )}
          </div>
        </div>
      </CardContent>
      
      {/* Post Footer */}
      <CardFooter className="flex items-center justify-between p-4 border-t">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="flex items-center gap-1 text-gray-600">
            <ThumbsUp className="h-4 w-4" />
            <span>{post.likes || 0}</span>
          </Button>
          
          <Button variant="ghost" size="sm" className="flex items-center gap-1 text-gray-600">
            <MessageSquare className="h-4 w-4" />
            <span>{post.comments || 0}</span>
          </Button>
        </div>
        
        <Button variant="ghost" size="sm" className="text-gray-600">
          <Share2 className="h-4 w-4 mr-1" />
          Share
        </Button>
      </CardFooter>
    </Card>
  );
}
