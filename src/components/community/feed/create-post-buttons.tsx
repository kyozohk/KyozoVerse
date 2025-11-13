'use client';

import React, { useState } from 'react';
import { Plus, Pencil, Mic, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomButton } from '@/components/ui';

export type PostType = 'text' | 'image' | 'audio' | 'video';

interface CreatePostButtonsProps {
  onSelectPostType: (type: PostType) => void;
}

export const CreatePostButtons: React.FC<CreatePostButtonsProps> = ({ onSelectPostType }) => {
  const [isOpen, setIsOpen] = useState(false);

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
        {isOpen && (
          <div className="flex flex-col gap-2">
            {buttonConfig.map((config) => (
              <Button
                key={config.type}
                isIconOnly
                className="rounded-full w-14 h-14"                
                style={{
                  backgroundColor: `${config.color}4D`, // 30% opacity
                  borderColor: config.color,
                  color: config.color
                }}
                onClick={() => {
                    onSelectPostType(config.type);
                    setIsOpen(false);
                }}
              >
                <config.icon className="w-6 h-6" />
              </Button>
            ))}
          </div>
        )}
        <CustomButton
            icon={Plus}
            className="rounded-full w-16 h-16 shadow-lg"
            onClick={() => setIsOpen(!isOpen)}
            style={{
                backgroundColor: '#C170CF',
                color: 'white'
            }}
        >
          <Plus className={`w-8 h-8 transition-transform ${isOpen ? 'rotate-45' : ''}`} />
        </CustomButton>
      </div>
    </div>
  );
};
