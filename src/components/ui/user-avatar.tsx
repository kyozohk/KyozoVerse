'use client';

import React from 'react';

interface UserAvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: number;
  className?: string;
}

// Generate a consistent color based on the name
function getColorFromName(name: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
    '#E76F51', '#2A9D8F', '#E9C46A', '#F4A261', '#264653',
    '#8338EC', '#3A86FF', '#FB5607', '#FF006E', '#FFBE0B',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

// Get initials from name (up to 3 characters)
function getInitials(name: string): string {
  if (!name) return '?';
  
  const words = name.trim().split(/\s+/);
  
  if (words.length === 1) {
    // Single word: take first 2-3 characters
    return words[0].substring(0, 2).toUpperCase();
  } else {
    // Multiple words: take first letter of first 2-3 words
    return words
      .slice(0, 3)
      .map(word => word[0])
      .join('')
      .toUpperCase();
  }
}

export function UserAvatar({ name, imageUrl, size = 40, className = '' }: UserAvatarProps) {
  const initials = getInitials(name);
  const bgColor = getColorFromName(name);
  
  if (imageUrl) {
    return (
      <div
        className={`rounded-full overflow-hidden flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // If image fails to load, hide it and show initials instead
            e.currentTarget.style.display = 'none';
            if (e.currentTarget.nextSibling) {
              (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex';
            }
          }}
        />
        <div
          className="w-full h-full flex items-center justify-center font-semibold text-white"
          style={{
            backgroundColor: bgColor,
            fontSize: `${size * 0.4}px`,
            display: 'none',
          }}
        >
          {initials}
        </div>
      </div>
    );
  }
  
  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: bgColor,
        fontSize: `${size * 0.4}px`,
      }}
    >
      {initials}
    </div>
  );
}
