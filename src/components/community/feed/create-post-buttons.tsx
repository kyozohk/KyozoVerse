
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
      <div className="relative flex flex-col items-center gap-2">
        {/* Post Type Buttons */}
        <div className="flex flex-col gap-2">
          {buttonConfig.map((config) => (
            <Button
              key={config.type}
              className="rounded-full w-14 h-14 relative border"
              style={{
                backgroundColor: `${config.color}80`, // 50% opacity
                borderColor: config.color,
                color: 'white',
              }}
              onClick={() => {
                onSelectPostType(config.type);
              }}
            >
              <config.icon
                className="w-5 h-5 absolute"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
