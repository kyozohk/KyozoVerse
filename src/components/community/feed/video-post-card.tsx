'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { type Post } from "@/lib/types";
import Image from "next/image";

interface VideoPostCardProps {
  post: Post & { id: string };
}

export const VideoPostCard: React.FC<VideoPostCardProps> = ({ post }) => {
  const { user } = useAuth();
  const isPostCreator = user && post.authorId === user.uid;
  return (
    <Card 
        className="overflow-hidden shadow-lg transition-all hover:border-orange-500/50 relative"
        style={{ backgroundImage: `url('/bg/video_bg.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
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
        {post.content.mediaUrls && post.content.mediaUrls.length > 0 && (
            <div className="w-full h-64 overflow-hidden relative">
                <Image 
                    src={post.content.mediaUrls![0]} 
                    alt={post.title || "Post video"} 
                    fill
                    className="object-cover"
                    onLoad={() => console.log('Image loaded successfully:', post.content.mediaUrls![0])}
                    onError={() => {
                        console.error('Image failed to load:', post.content.mediaUrls![0]);
                    }}
                />
            </div>
        )}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold rounded-full px-2 py-1 bg-orange-500 text-white">Watch</span>
            <span className="text-xs text-gray-500">Short form video</span>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-black">{post.title}</h2>
        <p className="text-base mb-4 text-gray-700">{post.content.text}</p>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
            <span>00/00/00 - 4 min video</span>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <span>WATCH</span>
                <PlayCircle className="h-4 w-4" />
            </Button>
        </div>
      </div>
    </Card>
  );
};
