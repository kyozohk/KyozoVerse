import { NextRequest, NextResponse } from 'next/server';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '@/firebase/config';

const storage = getStorage(app);

export async function GET(
  req: NextRequest,
  { params }: { params: { mediaId: string } }
) {
  try {
    const { mediaId } = params;
    
    if (!mediaId) {
      return NextResponse.json({ error: 'Media ID is required' }, { status: 400 });
    }

    const apiKey = process.env.WHATSAPP_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    console.log(`[Media API] Fetching media: ${mediaId}`);

    // Step 1: Get media URL from 360dialog
    const mediaInfoResponse = await fetch(`https://waba.360dialog.io/v1/media/${mediaId}`, {
      headers: {
        'D360-API-KEY': apiKey,
      },
    });

    if (!mediaInfoResponse.ok) {
      const errorText = await mediaInfoResponse.text();
      console.error(`[Media API] Failed to get media info:`, errorText);
      return NextResponse.json({ error: 'Failed to get media info' }, { status: mediaInfoResponse.status });
    }

    const mediaInfo = await mediaInfoResponse.json();
    const mediaUrl = mediaInfo.url;
    const mimeType = mediaInfo.mime_type;
    
    console.log(`[Media API] Got media URL, downloading...`);

    // Step 2: Download the media file
    const mediaResponse = await fetch(mediaUrl, {
      headers: {
        'D360-API-KEY': apiKey,
      },
    });

    if (!mediaResponse.ok) {
      console.error(`[Media API] Failed to download media`);
      return NextResponse.json({ error: 'Failed to download media' }, { status: mediaResponse.status });
    }

    const mediaBuffer = await mediaResponse.arrayBuffer();
    const mediaBlob = new Uint8Array(mediaBuffer);

    console.log(`[Media API] Downloaded ${mediaBlob.length} bytes, uploading to Firebase...`);

    // Step 3: Upload to Firebase Storage
    const fileExtension = mimeType?.split('/')[1] || 'jpg';
    const fileName = `whatsapp-media/${mediaId}.${fileExtension}`;
    const storageRef = ref(storage, fileName);

    await uploadBytes(storageRef, mediaBlob, {
      contentType: mimeType,
    });

    // Step 4: Get public URL
    const downloadURL = await getDownloadURL(storageRef);

    console.log(`[Media API] ✅ Media uploaded successfully: ${downloadURL}`);

    return NextResponse.json({
      url: downloadURL,
      mimeType: mimeType,
      mediaId: mediaId,
    });

  } catch (error: any) {
    console.error('[Media API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process media' },
      { status: 500 }
    );
  }
}
