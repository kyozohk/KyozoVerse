import { NextRequest, NextResponse } from 'next/server';
import { adminStorage, adminAuth } from '@/firebase/admin-config';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  console.log('Server-side upload API called');
  try {
    // Set CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers });
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const communityId = formData.get('communityId') as string;
    const userId = formData.get('userId') as string;
    const idToken = formData.get('token') as string;
    
    console.log('Upload request received:', {
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
      communityId,
      userId
    });

    if (!file || !communityId) {
      return NextResponse.json(
        { error: 'File and communityId are required' },
        { status: 400, headers }
      );
    }
    
    // Check if we're using mock mode
    const useMockAdmin = process.env.USE_MOCK_ADMIN === 'true';
    
    if (useMockAdmin) {
      console.log('Using mock mode for upload');
      // Generate a unique filename
      const uniqueId = randomUUID();
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const fileName = `community-posts/${communityId}/${Date.now()}_${uniqueId}_${safeFileName}`;
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate a fake download URL that matches the format of real Firebase Storage URLs
      const mockUrl = `https://storage.googleapis.com/kyozoverse.appspot.com/${encodeURIComponent(fileName)}?alt=media&token=${randomUUID()}`;
      
      console.log('Mock upload successful, returning URL:', mockUrl);
      
      return NextResponse.json({ url: mockUrl }, { headers });
    }
    
    // Real Firebase Admin SDK upload
    try {
      // Verify the token
      await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error('Invalid token:', error);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers }
      );
    }

    // Generate a unique filename
    const uniqueId = randomUUID();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `community-posts/${communityId}/${Date.now()}_${uniqueId}_${safeFileName}`;
    
    // Get a reference to the storage bucket
    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(fileName);
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Create a write stream
    console.log('Uploading file to Firebase Storage using Admin SDK');
    const writeStream = fileRef.createWriteStream({
      metadata: {
        contentType: file.type,
        metadata: {
          uploadedBy: userId,
          communityId: communityId
        }
      }
    });
    
    // Upload the file using a promise
    await new Promise((resolve, reject) => {
      writeStream.on('error', (error) => {
        console.error('Error uploading file:', error);
        reject(error);
      });
      
      writeStream.on('finish', () => {
        console.log('File uploaded successfully');
        resolve(true);
      });
      
      writeStream.end(buffer);
    });
    
    console.log('Generating signed URL');
    // Generate a signed URL that doesn't expire for a long time
    const [signedUrl] = await fileRef.getSignedUrl({
      action: 'read',
      expires: '03-01-2500', // Far future expiration
    });
    
    console.log('Signed URL generated:', signedUrl);
    
    return NextResponse.json({ url: signedUrl }, { headers });
  } catch (error) {
    console.error('Upload error:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    console.error('Firebase config:', {
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    });
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500, headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }}
    );
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
