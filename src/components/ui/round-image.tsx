import Image from 'next/image';
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

  return (
    <div
      className={cn('relative rounded-full overflow-hidden flex-shrink-0', className)}
      style={containerStyle}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={`${size}px`}
        className="object-cover rounded-full"
        priority={priority}
      />
    </div>
  );
}
