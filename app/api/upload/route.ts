import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/api-auth';

// Get storage bucket name from environment
const STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

// Helper function to validate file types
//
// SECURITY: SVG removed from the allow-list. SVG can contain inline JavaScript
// (`<script>`) and `<foreignObject>`, so user-uploaded SVGs rendered via
// <img> become a stored-XSS vector if the recipient ever opens the URL
// directly. If you need vector graphics, sanitize server-side first.
function isValidFileType(type: string): boolean {
  const validTypes = [
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    // Audio
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/x-m4a', 'audio/aac', 'audio/mp4',
    // Video
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/avi', 'video/x-matroska'
  ];
  
  return validTypes.includes(type);
}

/**
 * Generate a signed URL for client-side uploads.
 * This is the secure way to allow clients to upload files directly to GCS.
 */
export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (authResult.error) return authResult.error;

  try {
    // Set CORS headers
    const headers = {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_SITE_URL || 'https://pro.kyozo.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Get the form data with the file
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const communityId = formData.get('communityId') as string;
    // Use the verified Firebase Auth uid — never trust a client-supplied
    // x-user-id header (the previous implementation did, which let any
    // authenticated user attribute uploads to anybody else).
    const userId = authResult.uid!;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400, headers });
    }

    console.log('File received:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Validate file type
    if (!isValidFileType(file.type)) {
      console.error('Invalid file type:', file.type);
      return NextResponse.json({
        error: 'Invalid file type',
        message: `File type ${file.type} is not supported`
      }, { status: 400, headers });
    }

    // Validate file size based on type.
    //
    // Image limit dropped from 25MB -> 5MB (Apr 21 2026). A 7.6MB banner
    // upload was failing silently at the hosting-platform edge (Vercel's
    // default request-body ceiling is ~4.5MB), so the pretty 25MB number in
    // our UI was a lie. 5MB is the largest size we can guarantee actually
    // makes it through to this handler.
    const maxSizeInBytes = file.type.startsWith('video/')
      ? 100 * 1024 * 1024  // 100MB for videos
      : file.type.startsWith('audio/')
        ? 20 * 1024 * 1024  // 20MB for audio
        : 5 * 1024 * 1024;  // 5MB for images

    if (file.size > maxSizeInBytes) {
      const maxSizeMB = maxSizeInBytes / (1024 * 1024);
      console.error(`File too large: ${file.size} bytes (max: ${maxSizeInBytes} bytes)`);
      return NextResponse.json({
        error: 'File too large',
        message: `Maximum file size for ${file.type.split('/')[0]} files is ${maxSizeMB}MB`
      }, { status: 400, headers });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log('File converted to buffer, size:', buffer.length);

    // Generate a unique filename with proper folder structure based on file type
    let fileCategory = 'images';
    if (file.type.startsWith('audio/')) fileCategory = 'audio';
    if (file.type.startsWith('video/')) fileCategory = 'videos';

    // Sanitize file name: strip path components and control chars to prevent
    // path traversal (`../../etc/passwd`) and bucket key smuggling.
    const safeName = (file.name || 'upload')
      .replace(/[\\/:*?"<>|\x00-\x1f]/g, '_')
      .replace(/^\.+/, '')
      .slice(0, 200);
    const filename = `community-media/${communityId}/${fileCategory}/${Date.now()}-${safeName}`;
    console.log('Target filename:', filename);
    
    try {
      // Get a reference to the storage bucket
      if (!STORAGE_BUCKET) {
        throw new Error('Storage bucket not configured. Please set FIREBASE_STORAGE_BUCKET environment variable.');
      }

      const storage = admin.storage();
      console.log('Storage instance obtained');
      
      const bucket = storage.bucket(STORAGE_BUCKET);
      console.log('Bucket reference obtained:', STORAGE_BUCKET);
      
      const fileRef = bucket.file(filename);
      console.log('File reference created');
      
      // Upload the file
      console.log('Starting file upload...');
      await fileRef.save(buffer, {
        metadata: {
          contentType: file.type,
          metadata: {
            uploadedBy: userId,
            communityId: communityId,
            fileCategory: fileCategory
          }
        },
      });
      console.log('File uploaded successfully');
      
      // Make the file publicly readable (storage.rules already permits public
      // read on these paths) and use the public download URL instead of a
      // long-lived signed URL. Signed URLs are bearer tokens — if the URL is
      // ever leaked (accidental commit, log line, copy/paste), anyone holding
      // it can read the object until the URL expires. Year-2500 expirations
      // make accidental leaks effectively permanent.
      console.log('Marking object public for download URL...');
      try {
        await fileRef.makePublic();
      } catch (e) {
        console.warn('Failed to makePublic (may already be public):', e);
      }
      // Public URL pattern for default Firebase storage buckets.
      const url = `https://storage.googleapis.com/${STORAGE_BUCKET}/${encodeURI(filename)}`;
      console.log('Public download URL:', url);
      
      return NextResponse.json({ 
        success: true, 
        url, 
        fileType: file.type,
        fileCategory: fileCategory
      }, { headers });
    } catch (storageError: any) {
      console.error('Storage operation failed:', storageError);
      return NextResponse.json({ 
        error: 'Storage operation failed', 
        message: storageError.message || 'Unknown storage error',
        code: storageError.code || 'unknown'
      }, { status: 500, headers });
    }
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Upload failed', 
      message: error.message || 'Unknown error' 
    }, { status: 500, headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_SITE_URL || 'https://pro.kyozo.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }});
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_SITE_URL || 'https://pro.kyozo.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
