'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { type Post } from "@/lib/types";

interface AudioPostCardProps {
  post: Post & { id: string };
}

export const AudioPostCard: React.FC<AudioPostCardProps> = ({ post }) => {
  const { user } = useAuth();
  const isPostCreator = user && post.authorId === user.uid;
  return (
    <Card 
        className="overflow-hidden shadow-lg transition-all hover:border-blue-500/50 relative"
        style={{ backgroundImage: `url('/bg/audio_bg.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
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
            <Button variant="ghost" className="rounded-full">
                <PlayCircle className="h-8 w-8 text-gray-700" />
            </Button>
        </div>
      </div>
    </Card>
  );
};
