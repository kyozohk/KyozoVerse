'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface FirebaseImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function FirebaseImage({ src, alt, className = '' }: FirebaseImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState('');

  useEffect(() => {
    // Reset states when src changes
    setLoading(true);
    setError(false);
    
    // Process the URL if needed
    if (src) {
      // Make sure the URL is properly encoded
      try {
        // For debugging
        console.log('Processing image URL:', src);
        
        // Use the original URL as is
        setImageSrc(src);
      } catch (err) {
        console.error('Error processing image URL:', err);
        setError(true);
        setLoading(false);
        setImageSrc('/bg/image_placeholder.png');
      }
    } else {
      setError(true);
      setLoading(false);
      setImageSrc('/bg/image_placeholder.png');
    }
  }, [src]);

  // Function to handle image load
  const handleLoad = () => {
    console.log('Image loaded successfully:', src);
    setLoading(false);
  };

  // Function to handle image error
  const handleError = () => {
    console.error('Image failed to load:', src);
    setError(true);
    setLoading(false);
    setImageSrc('/bg/image_placeholder.png');
  };

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="w-full h-full" />
        </div>
      )}
      <img
        src={imageSrc}
        alt={alt}
        className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}
