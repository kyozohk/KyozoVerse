'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";
import { type Post } from "@/lib/types";

interface AudioPostCardProps {
  post: Post & { id: string };
}

export const AudioPostCard: React.FC<AudioPostCardProps> = ({ post }) => {
  return (
    <Card 
        className="overflow-hidden shadow-lg transition-transform hover:scale-105"
        style={{ backgroundImage: `url('/bg/audio_bg.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="p-6">
        <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold rounded-full px-2 py-1 bg-blue-500 text-white">Listen</span>
            <span className="text-xs text-gray-500">Podcast</span>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-black">{post.title}</h2>
        <p className="text-base mb-4 text-gray-700">{post.content.text}</p>
        
        <div className="flex items-center gap-4">
            <div className="flex-grow bg-gray-300 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full w-1/4"></div>
            </div>
            <span className="text-sm text-gray-600">01:00/4:57</span>
            <Button isIconOnly variant="ghost" className="rounded-full">
                <PlayCircle className="h-8 w-8 text-gray-700" />
            </Button>
        </div>
      </div>
    </Card>
  );
};
