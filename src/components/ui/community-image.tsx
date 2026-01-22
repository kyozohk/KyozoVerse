import Image from 'next/image';
import { cn } from '@/lib/utils';
import { CSSProperties } from 'react';

interface CommunityImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  sizes?: string;
  backgroundColor?: string;
  containerClassName?: string;
  containerStyle?: CSSProperties;
  priority?: boolean;
}

export function CommunityImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  sizes,
  backgroundColor = '#E2D9C9',
  containerClassName,
  containerStyle,
  priority = false,
}: CommunityImageProps) {
  // For fill images, wrap in a container with background color
  if (fill) {
    return (
      <div 
        className={cn('relative', containerClassName)} 
        style={{ backgroundColor, ...containerStyle }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className={cn('object-cover', className)}
          priority={priority}
        />
      </div>
    );
  }

  // For fixed-size images, apply background and maintain aspect ratio
  const isRounded = containerClassName?.includes('rounded-full');
  
  return (
    <div
      className={cn('relative inline-block overflow-hidden', containerClassName)}
      style={{
        backgroundColor,
        width: width ? `${width}px` : 'auto',
        height: height ? `${height}px` : 'auto',
        ...containerStyle,
      }}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={cn(className, isRounded && 'rounded-full')}
        style={{ width: width ? `${width}px` : 'auto', height: 'auto' }}
        priority={priority}
      />
    </div>
  );
}
