
'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { Plus } from 'lucide-react';

interface ProfileImageSelectorProps {
  selectedImage: string | null;
  onSelectImage: (url: string) => void;
  onSelectFile: (file: File) => void;
}

const profileImageOptions = ['/Parallax1.jpg', '/Parallax2.jpg', '/Parallax3.jpg', '/Parallax4.jpg', '/Parallax5.jpg', '/Parallax6.png'];
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
    <div className="inputWrapper my-2 relative">
      <div
        className="flex items-center gap-4 p-4 rounded-lg border border-dotted"
        style={{ borderWidth: '1px', borderColor: 'var(--input-border-color, #C170CF)' }}
      >
      {profileImageOptions.map((src) => (
        <div
          key={src}
          className="relative w-12 h-12 rounded-full cursor-pointer transition-all"
          onClick={() => handlePresetClick(src)}
        >
          <Image
            src={src}
            alt="Profile option"
            fill
            className="rounded-full object-cover"
          />
          {isPresetSelected(src) && (
            <div
              className="absolute inset-0 rounded-full border-[3px]"
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
              fill
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
      <label
        className="floatingLabel"
        style={{
          top: '-0.7rem',
          fontSize: '0.75rem',
          backgroundColor: '#EDEDED',
          color: 'var(--input-border-color, #C170CF)',
        }}
      >
        Profile Icon
      </label>
    </div>
  );
}
