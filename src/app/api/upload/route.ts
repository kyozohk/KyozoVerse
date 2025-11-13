import { NextRequest, NextResponse } from 'next/server';
import { adminStorage, adminAuth } from '@/firebase/admin-config';

/**
 * Generate a signed URL for client-side uploads.
 * This is the secure way to allow clients to upload files directly to GCS.
 */
export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    
    // Verify the user's token to ensure they are authenticated
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error("Error verifying ID token:", error);
      return NextResponse.json({ error: 'Invalid authentication token.' }, { status: 403 });
    }
    
    const uid = decodedToken.uid;
    const body = await request.json();
    const { fileName, contentType, communityId } = body;

    if (!fileName || !contentType || !communityId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const bucket = adminStorage.bucket();
    const filePath = `community-posts/${communityId}/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const file = bucket.file(filePath);

    // Generate a signed URL for PUT requests, valid for 15 minutes
    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: contentType,
    });

    // Construct the public URL for accessing the file after upload
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    
    return NextResponse.json({ signedUrl, publicUrl });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
  }
}
