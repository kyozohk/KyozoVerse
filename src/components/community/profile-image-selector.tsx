
'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { Plus } from 'lucide-react';

interface ProfileImageSelectorProps {
  selectedImage: string | null;
  onSelectImage: (url: string) => void;
  onSelectFile: (file: File) => void;
}

const profileImageOptions = ['/images/Parallax1.jpg', '/images/Parallax2.jpg', '/images/Parallax3.jpg', '/images/Parallax4.jpg', '/images/Parallax5.jpg'];
const activeColor = "#843484"; // Default purple color

export function ProfileImageSelector({ selectedImage, onSelectImage, onSelectFile }: ProfileImageSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectFile(file);
      onSelectImage(URL.createObjectURL(file));
    }
  };

  const handlePresetClick = (src: string) => {
    onSelectImage(src);
  };
  
  const isPresetSelected = (src: string) => {
    return selectedImage === src;
  }
  
  const isCustomSelected = selectedImage && !profileImageOptions.includes(selectedImage);

  return (
    <div className="flex items-center gap-4">
      {profileImageOptions.map((src) => (
        <div
          key={src}
          className="relative w-12 h-12 rounded-full cursor-pointer"
          onClick={() => handlePresetClick(src)}
        >
          <Image
            src={src}
            alt="Profile option"
            width={48}
            height={48}
            className="rounded-full object-cover"
          />
          {isPresetSelected(src) && (
            <div
              className="absolute inset-0 rounded-full border-2"
              style={{ borderColor: activeColor }}
            />
          )}
        </div>
      ))}
      <div
        className="relative w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer"
        style={{ borderColor: activeColor, color: activeColor }}
        onClick={handleBrowseClick}
      >
        {isCustomSelected ? (
          <>
            <Image
              src={selectedImage!}
              alt="Custom selection"
              width={48}
              height={48}
              className="rounded-full object-cover"
            />
             <div
              className="absolute inset-0 rounded-full border-2"
              style={{ borderColor: activeColor }}
            />
          </>
        ) : (
          <Plus className="h-6 w-6" />
        )}
      </div>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  );
}

