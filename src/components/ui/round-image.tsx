import Image from 'next/image';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CSSProperties } from 'react';

interface RoundImageProps {
  src: string;
  alt: string;
  size?: number; // Size in pixels (default: 120)
  backgroundColor?: string; // Default: #E2D9C9
  border?: boolean; // Whether to show border (default: false)
  borderColor?: string; // Border color (default: var(--page-content-border))
  borderWidth?: number; // Border width in pixels (default: 2)
  className?: string;
  priority?: boolean;
}

export function RoundImage({
  src,
  alt,
  size = 120,
  backgroundColor = '#E2D9C9',
  border = false,
  borderColor = 'var(--page-content-border)',
  borderWidth = 2,
  className,
  priority = false,
}: RoundImageProps) {
  const containerStyle: CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    backgroundColor,
    ...(border && {
      border: `${borderWidth}px solid ${borderColor}`,
    }),
  };

  // Check if image is a placeholder or missing
  const isPlaceholder = !src || src.includes('placeholder') || src.includes('default-avatar') || src === '/default-avatar.png';
  const iconSize = Math.floor(size * 0.5); // Icon is 50% of container size

  return (
    <div
      className={cn('relative rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center', className)}
      style={containerStyle}
    >
      {isPlaceholder ? (
        <User 
          className="text-muted-foreground" 
          style={{ width: `${iconSize}px`, height: `${iconSize}px`, color: '#A07856' }}
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={`${size}px`}
          className="object-cover rounded-full"
          priority={priority}
        />
      )}
    </div>
  );
}
