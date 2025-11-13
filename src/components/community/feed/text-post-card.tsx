'use client';

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThumbsUp, MessageSquare, Share2, ArrowRight } from "lucide-react";
import { type Post } from "@/lib/types";
import Image from "next/image";

interface TextPostCardProps {
  post: Post & { id: string };
}

export const TextPostCard: React.FC<TextPostCardProps> = ({ post }) => {
    const hasImage = post.content.mediaUrls && post.content.mediaUrls.length > 0;
    const backgroundStyle = hasImage ? 
        { backgroundImage: `url(${post.content.mediaUrls![0]})`, backgroundSize: 'cover', backgroundPosition: 'center' } : 
        { backgroundImage: `url('/bg/text_bg.png')`, backgroundSize: 'cover', backgroundPosition: 'center' };


  return (
    <Card 
        className="overflow-hidden shadow-lg transition-transform hover:scale-105"
        style={backgroundStyle}
    >
      <div className={`flex ${hasImage ? 'flex-col md:flex-row' : 'flex-col'} ${hasImage ? 'backdrop-blur-sm bg-black/30' : ''}`}>
        {hasImage && (
            <div className="w-full md:w-1/3 h-48 md:h-auto overflow-hidden">
                 <Image 
                    src={post.content.mediaUrls![0]} 
                    alt={post.title || "Post image"} 
                    width={300}
                    height={300}
                    className="object-cover w-full h-full"
                  />
            </div>
        )}
        <div className={`p-6 flex flex-col justify-between ${hasImage ? 'w-full md:w-2/3 text-white' : 'text-black'}`}>
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
    </Card>
  );
};
