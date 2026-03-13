import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_AUDIO_SIZE = 20 * 1024 * 1024; // 20MB

const TARGET_IMAGE_SIZE = 8 * 1024 * 1024; // Target 8MB for images (leaving buffer)
const MAX_IMAGE_DIMENSION = 2048; // Max width/height for images

export async function POST(request: NextRequest) {
  try {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400, headers });
    }

    const fileType = file.type;
    const fileSize = file.size;

    // Check if file needs resizing
    if (fileType.startsWith('image/')) {
      if (fileSize <= MAX_IMAGE_SIZE) {
        return NextResponse.json({ 
          needsResize: false, 
          message: 'Image is within size limit',
          originalSize: fileSize,
          maxSize: MAX_IMAGE_SIZE
        }, { headers });
      }

      // Resize image using Sharp
      const buffer = Buffer.from(await file.arrayBuffer());
      
      let quality = 85;
      let resizedBuffer: Buffer;
      let metadata: sharp.Metadata;

      // Get image metadata
      const image = sharp(buffer);
      metadata = await image.metadata();

      // Calculate new dimensions while maintaining aspect ratio
      let width = metadata.width || MAX_IMAGE_DIMENSION;
      let height = metadata.height || MAX_IMAGE_DIMENSION;
      
      if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
        const aspectRatio = width / height;
        if (width > height) {
          width = MAX_IMAGE_DIMENSION;
          height = Math.round(MAX_IMAGE_DIMENSION / aspectRatio);
        } else {
          height = MAX_IMAGE_DIMENSION;
          width = Math.round(MAX_IMAGE_DIMENSION * aspectRatio);
        }
      }

      // Try different quality levels until we get under target size
      while (quality > 20) {
        resizedBuffer = await sharp(buffer)
          .resize(width, height, { 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .jpeg({ quality, mozjpeg: true })
          .toBuffer();

        if (resizedBuffer.length <= TARGET_IMAGE_SIZE) {
          break;
        }

        quality -= 10;
      }

      // If still too large, reduce dimensions further
      if (resizedBuffer!.length > TARGET_IMAGE_SIZE) {
        width = Math.round(width * 0.8);
        height = Math.round(height * 0.8);
        
        resizedBuffer = await sharp(buffer)
          .resize(width, height, { 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .jpeg({ quality: 70, mozjpeg: true })
          .toBuffer();
      }

      // Return the resized file as a blob
      return new NextResponse(resizedBuffer!.buffer as ArrayBuffer, {
        headers: {
          ...headers,
          'Content-Type': 'image/jpeg',
          'Content-Disposition': `attachment; filename="${file.name.replace(/\.[^.]+$/, '.jpg')}"`,
          'X-Original-Size': fileSize.toString(),
          'X-Resized-Size': resizedBuffer!.length.toString(),
          'X-Compression-Ratio': (((fileSize - resizedBuffer!.length) / fileSize) * 100).toFixed(2),
        },
      });

    } else if (fileType.startsWith('video/')) {
      // For videos, we can't easily resize server-side without FFmpeg
      // Return instructions for client-side handling
      if (fileSize <= MAX_VIDEO_SIZE) {
        return NextResponse.json({ 
          needsResize: false, 
          message: 'Video is within size limit',
          originalSize: fileSize,
          maxSize: MAX_VIDEO_SIZE
        }, { headers });
      }

      return NextResponse.json({ 
        error: 'Video too large',
        message: `Video size (${(fileSize / (1024 * 1024)).toFixed(2)}MB) exceeds maximum (${MAX_VIDEO_SIZE / (1024 * 1024)}MB). Please compress the video before uploading.`,
        suggestions: [
          'Use a video compression tool like HandBrake',
          'Reduce video resolution (e.g., 1080p → 720p)',
          'Lower the bitrate',
          'Trim unnecessary parts of the video'
        ],
        originalSize: fileSize,
        maxSize: MAX_VIDEO_SIZE
      }, { status: 413, headers });

    } else if (fileType.startsWith('audio/')) {
      if (fileSize <= MAX_AUDIO_SIZE) {
        return NextResponse.json({ 
          needsResize: false, 
          message: 'Audio is within size limit',
          originalSize: fileSize,
          maxSize: MAX_AUDIO_SIZE
        }, { headers });
      }

      return NextResponse.json({ 
        error: 'Audio file too large',
        message: `Audio size (${(fileSize / (1024 * 1024)).toFixed(2)}MB) exceeds maximum (${MAX_AUDIO_SIZE / (1024 * 1024)}MB). Please compress the audio before uploading.`,
        suggestions: [
          'Convert to MP3 format with lower bitrate (128kbps or 192kbps)',
          'Use audio compression tools',
          'Trim silence or unnecessary parts'
        ],
        originalSize: fileSize,
        maxSize: MAX_AUDIO_SIZE
      }, { status: 413, headers });
    }

    return NextResponse.json({ 
      error: 'Unsupported file type',
      message: `File type ${fileType} is not supported for resizing`
    }, { status: 400, headers });

  } catch (error: any) {
    console.error('Resize error:', error);
    return NextResponse.json({ 
      error: 'Resize failed', 
      message: error.message || 'Unknown error' 
    }, { 
      status: 500, 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
