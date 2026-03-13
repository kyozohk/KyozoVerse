# Image & Video Resize API

## File Size Limits

Firebase Storage has the following upload limits enforced by the `/api/upload` endpoint:

| File Type | Maximum Size |
|-----------|-------------|
| **Images** | 10 MB |
| **Audio** | 20 MB |
| **Videos** | 100 MB |

## Automatic Image Resizing

For images that exceed the 10MB limit, use the `/api/resize` endpoint to automatically compress them.

### Endpoint

```
POST /api/resize
```

### Request

**Content-Type:** `multipart/form-data`

**Body:**
- `file`: The image file to resize

### Response

**Success (200):**
- Returns the resized image as a JPEG blob
- Headers include:
  - `X-Original-Size`: Original file size in bytes
  - `X-Resized-Size`: Resized file size in bytes
  - `X-Compression-Ratio`: Percentage reduction (e.g., "65.43")

**Already within limit (200):**
```json
{
  "needsResize": false,
  "message": "Image is within size limit",
  "originalSize": 8388608,
  "maxSize": 10485760
}
```

**Error (413 - Payload Too Large):**
```json
{
  "error": "Video too large",
  "message": "Video size (150.25MB) exceeds maximum (100MB)...",
  "suggestions": [
    "Use a video compression tool like HandBrake",
    "Reduce video resolution (e.g., 1080p → 720p)",
    "Lower the bitrate",
    "Trim unnecessary parts of the video"
  ],
  "originalSize": 157286400,
  "maxSize": 104857600
}
```

## How It Works

### Image Compression Strategy

1. **Dimension Check**: If image is larger than 2048px (width or height), it's resized proportionally
2. **Quality Reduction**: JPEG quality starts at 85% and reduces in 10% steps until target size (8MB) is reached
3. **Further Reduction**: If still too large, dimensions are reduced by 20% and quality set to 70%
4. **Output Format**: All images are converted to JPEG for maximum compatibility and compression

### Video & Audio

Videos and audio files cannot be automatically resized server-side (would require FFmpeg). The API returns helpful error messages with compression suggestions.

## Client-Side Usage

### Using the Utility Function

```typescript
import { resizeImageIfNeeded, formatFileSize } from '@/lib/image-resize';

async function handleFileUpload(file: File) {
  // Automatically resize if needed
  const result = await resizeImageIfNeeded(file);
  
  if (!result.success) {
    console.error('Resize failed:', result.error);
    return;
  }
  
  if (result.needsResize) {
    console.log(`Compressed from ${formatFileSize(result.originalSize)} to ${formatFileSize(result.resizedSize!)}`);
    console.log(`Compression ratio: ${result.compressionRatio}%`);
  }
  
  // Upload the (possibly resized) file
  const formData = new FormData();
  formData.append('file', result.file!);
  formData.append('communityId', 'your-community-id');
  
  await fetch('/api/upload', {
    method: 'POST',
    headers: { 'x-user-id': userId },
    body: formData,
  });
}
```

### Manual API Call

```typescript
async function resizeImage(file: File): Promise<File> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/resize', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Resize failed');
  }
  
  const blob = await response.blob();
  return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
    type: 'image/jpeg',
  });
}
```

## Upload Flow with Auto-Resize

```typescript
import { resizeImageIfNeeded, exceedsSizeLimit } from '@/lib/image-resize';

async function uploadWithAutoResize(file: File, communityId: string, userId: string) {
  let fileToUpload = file;
  
  // Check if resize is needed
  if (file.type.startsWith('image/') && exceedsSizeLimit(file)) {
    console.log('Image exceeds limit, resizing...');
    const result = await resizeImageIfNeeded(file);
    
    if (!result.success) {
      throw new Error(result.error || 'Resize failed');
    }
    
    fileToUpload = result.file!;
    console.log(`Resized: ${result.originalSize} → ${result.resizedSize} bytes`);
  }
  
  // Upload
  const formData = new FormData();
  formData.append('file', fileToUpload);
  formData.append('communityId', communityId);
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'x-user-id': userId },
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Upload failed');
  }
  
  return await response.json();
}
```

## Error Handling

When the upload endpoint receives a file that's too large, it returns a 413 status with helpful information:

```json
{
  "error": "File too large",
  "message": "File size (15.23MB) exceeds maximum (10MB)",
  "currentSize": 15966208,
  "maxSize": 10485760,
  "fileType": "image/jpeg",
  "resizeEndpoint": "/api/resize",
  "suggestion": "You can use the /api/resize endpoint to automatically compress this image before uploading."
}
```

## Best Practices

1. **Always check file size before upload** using `exceedsSizeLimit(file)`
2. **Auto-resize images** using `resizeImageIfNeeded(file)` 
3. **Show compression stats** to users so they know their image was optimized
4. **For videos/audio**, show error messages with compression tool suggestions
5. **Handle errors gracefully** - resize can fail if image is corrupted

## Supported Image Formats

Input formats (automatically converted to JPEG):
- JPEG/JPG
- PNG
- GIF
- WebP
- SVG

Output format: **JPEG** (best compression ratio)

## Technical Details

- **Library**: Sharp (high-performance image processing)
- **Max dimensions**: 2048x2048px
- **Target size**: 8MB (leaves 2MB buffer under 10MB limit)
- **Quality range**: 20-85% (adaptive based on file size)
- **Compression**: MozJPEG for optimal quality/size ratio
