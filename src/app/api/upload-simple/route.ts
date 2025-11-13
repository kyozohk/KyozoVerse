import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

/**
 * A fully mocked upload API that doesn't require Firebase credentials
 * This simulates a successful upload and returns a fake URL
 */
export async function POST(request: NextRequest) {
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
    const token = formData.get('token') as string;

    console.log('Mock upload API called:', {
      fileName: file?.name,
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

    // Generate a unique filename
    const fileName = `community-posts/${communityId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate a fake download URL
    const uuid = randomUUID();
    const fileType = file.type.split('/')[0]; // 'image', 'audio', 'video', etc.
    
    // Create a fake URL that looks like a Firebase Storage URL
    const mockUrl = `https://firebasestorage.googleapis.com/v0/b/kyozoverse.appspot.com/o/${encodeURIComponent(fileName)}?alt=media&token=${uuid}`;
    
    console.log('Mock upload successful, returning URL:', mockUrl);
    
    return NextResponse.json({ url: mockUrl }, { headers });
  } catch (error) {
    console.error('Upload error:', error);
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
