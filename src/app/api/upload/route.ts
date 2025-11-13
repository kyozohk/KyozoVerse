import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin if it hasn't been initialized
let app: App;

try {
  if (!getApps().length) {
    // Log environment variables for debugging (without exposing the full private key)
    console.log('Firebase Admin SDK initialization:');
    console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);
    console.log('Client Email:', process.env.FIREBASE_CLIENT_EMAIL);
    console.log('Private Key exists:', !!process.env.FIREBASE_PRIVATE_KEY);
    
    // Initialize with the correct bucket name
    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY,
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
    
    console.log('Firebase Admin SDK initialized successfully');
  } else {
    console.log('Firebase Admin SDK already initialized');
  }
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
}

// Helper function to validate file types
function isValidFileType(type: string): boolean {
  const validTypes = [
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    // Audio
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac',
    // Video
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'
  ];
  
  return validTypes.includes(type);
}

export async function POST(request: NextRequest) {
  try {
    // Set CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Check if user is authenticated
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    }

    // Get the form data with the file
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const communityId = formData.get('communityId') as string;
    
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
    
    // Validate file size based on type
    const maxSizeInBytes = file.type.startsWith('video/') 
      ? 100 * 1024 * 1024  // 100MB for videos
      : file.type.startsWith('audio/') 
        ? 20 * 1024 * 1024  // 20MB for audio
        : 10 * 1024 * 1024; // 10MB for images
    
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
    
    const filename = `community-posts/${communityId}/${fileCategory}/${Date.now()}-${file.name}`;
    console.log('Target filename:', filename);
    
    try {
      // Get a reference to the storage bucket
      const storage = getStorage();
      console.log('Storage instance obtained');
      
      const bucket = storage.bucket();
      console.log('Bucket reference obtained');
      
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
      
      // Get the public URL
      console.log('Generating signed URL...');
      const [url] = await fileRef.getSignedUrl({
        action: 'read',
        expires: '03-01-2500', // Set a far future expiration
      });
      console.log('Signed URL generated:', url.substring(0, 50) + '...');
      
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
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }});
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
