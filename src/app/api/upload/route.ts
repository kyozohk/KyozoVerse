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

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log('File converted to buffer, size:', buffer.length);
    
    // Generate a unique filename
    const filename = `community-posts/${communityId}/${Date.now()}-${file.name}`;
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
            communityId: communityId
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
      
      return NextResponse.json({ success: true, url }, { headers });
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
