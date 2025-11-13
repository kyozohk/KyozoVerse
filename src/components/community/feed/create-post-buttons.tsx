
'use client';

import React from 'react';
import { Plus, Pencil, Mic, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomButton } from '@/components/ui';

export type PostType = 'text' | 'image' | 'audio' | 'video';

interface CreatePostButtonsProps {
  onSelectPostType: (type: PostType) => void;
}

export const CreatePostButtons: React.FC<CreatePostButtonsProps> = ({ onSelectPostType }) => {
  const buttonConfig = [
    {
      type: 'text' as PostType,
      icon: Pencil,
      color: '#C170CF',
      label: 'Text',
    },
    {
      type: 'audio' as PostType,
      icon: Mic,
      color: '#699FE5',
      label: 'Audio',
    },
    {
      type: 'video' as PostType,
      icon: Video,
      color: '#CF7770',
      label: 'Video',
    },
  ];

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <div className="relative flex flex-col items-center gap-4">
        {/* Post Type Buttons */}
        <div className="flex flex-col gap-2">
          {buttonConfig.map((config) => (
            <button
              key={config.type}
              className="rounded-full w-10 h-10 flex items-center justify-center cursor-pointer border-0 outline-none"
              style={{
                backgroundColor: `${config.color}90`, // 50% opacity
                color: 'white',
                border: `1px solid ${config.color}`,
              }}
              onClick={() => {
                onSelectPostType(config.type);
              }}
            >
              <config.icon className="w-6 h-6" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
