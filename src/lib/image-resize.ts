/**
 * Client-side utility for resizing images before upload
 */

export interface ResizeResult {
  success: boolean;
  file?: File;
  originalSize: number;
  resizedSize?: number;
  compressionRatio?: number;
  error?: string;
  needsResize?: boolean;
}

/**
 * Check if a file needs resizing and optionally resize it
 */
export async function resizeImageIfNeeded(file: File): Promise<ResizeResult> {
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

  // Check if file is an image
  if (!file.type.startsWith('image/')) {
    return {
      success: false,
      originalSize: file.size,
      error: 'File is not an image',
    };
  }

  // If file is already under limit, no need to resize
  if (file.size <= MAX_IMAGE_SIZE) {
    return {
      success: true,
      file,
      originalSize: file.size,
      needsResize: false,
    };
  }

  // Call the resize API
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/resize', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        originalSize: file.size,
        error: error.message || 'Resize failed',
      };
    }

    // Get the resized image blob
    const blob = await response.blob();
    const resizedSize = parseInt(response.headers.get('X-Resized-Size') || '0');
    const compressionRatio = parseFloat(response.headers.get('X-Compression-Ratio') || '0');

    // Create a new File from the blob
    const resizedFile = new File(
      [blob],
      file.name.replace(/\.[^.]+$/, '.jpg'),
      { type: 'image/jpeg' }
    );

    return {
      success: true,
      file: resizedFile,
      originalSize: file.size,
      resizedSize,
      compressionRatio,
      needsResize: true,
    };
  } catch (error) {
    return {
      success: false,
      originalSize: file.size,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Get file size limits based on type
 */
export function getFileSizeLimit(fileType: string): number {
  if (fileType.startsWith('video/')) return 100 * 1024 * 1024; // 100MB
  if (fileType.startsWith('audio/')) return 20 * 1024 * 1024; // 20MB
  return 10 * 1024 * 1024; // 10MB for images
}

/**
 * Check if file exceeds size limit
 */
export function exceedsSizeLimit(file: File): boolean {
  const limit = getFileSizeLimit(file.type);
  return file.size > limit;
}
