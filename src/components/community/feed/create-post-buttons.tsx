
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
              isIconOnly
              className="rounded-full w-14 h-14 relative"
              style={{
                backgroundColor: `${config.color}4D`, // 30% opacity
                borderColor: config.color,
                color: 'white', // Set icon color to white
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

        {/* Main Add Button */}
        <div className="relative w-16 h-16">
          <CustomButton
            className="rounded-full w-full h-full shadow-lg"
            style={{
              backgroundColor: '#C170CF',
              color: 'white',
            }}
          >
            {/* This button is now purely decorative or could have a default action */}
          </CustomButton>
          <div
            className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none"
          >
            <Plus className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};
