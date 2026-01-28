import Image from 'next/image';
import { cn } from '@/lib/utils';
import { CSSProperties } from 'react';
import { Users } from 'lucide-react';

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
  // Check if src is empty or invalid
  const hasValidSrc = src && src.trim() !== '';

  // Placeholder component when no image
  const Placeholder = ({ size }: { size?: number }) => (
    <div className="flex items-center justify-center w-full h-full">
      <Users 
        className="text-muted-foreground" 
        style={{ 
          width: size ? `${size * 0.4}px` : '40%', 
          height: size ? `${size * 0.4}px` : '40%',
          color: '#A07856' 
        }}
      />
    </div>
  );

  // For fill images, wrap in a container with background color
  if (fill) {
    return (
      <div 
        className={cn('relative', containerClassName)} 
        style={{ backgroundColor, ...containerStyle }}
      >
        {hasValidSrc ? (
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            className={cn('object-cover', className)}
            priority={priority}
          />
        ) : (
          <Placeholder />
        )}
      </div>
    );
  }

  // For fixed-size images, apply background and maintain aspect ratio
  const isRounded = containerClassName?.includes('rounded-full');
  
  return (
    <div
      className={cn('relative inline-block overflow-hidden flex items-center justify-center', containerClassName)}
      style={{
        backgroundColor,
        width: width ? `${width}px` : 'auto',
        height: height ? `${height}px` : 'auto',
        ...containerStyle,
      }}
    >
      {hasValidSrc ? (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={cn(className, isRounded && 'rounded-full')}
          style={{ width: width ? `${width}px` : 'auto', height: 'auto' }}
          priority={priority}
        />
      ) : (
        <Placeholder size={width || height} />
      )}
    </div>
  );
}
