import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/firebase/admin';
import { storage } from '@/firebase/storage';
import { ref, deleteObject } from 'firebase/storage';

function extractStoragePath(url: string): string | null {
  try {
    if (url.includes('/o/')) {
      const path = decodeURIComponent(url.split('/o/')[1].split('?')[0]);
      return path;
    }
    
    if (url.includes('community-posts/')) {
      const match = url.match(/community-posts\/[\w-]+\/[\w-]+\/[\d-]+[^?\s]+/);
      if (match) {
        return match[0];
      }
    }
    
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    if (pathname.includes('community-posts/')) {
      const match = pathname.match(/community-posts\/[\w-]+\/[\w-]+\/[\d-]+[^?\s]+/);
      if (match) {
        return match[0];
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting path:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Delete API route called');
    
    // Initialize Firebase Admin
    initAdmin();
    const db = getFirestore();
    
    const body = await request.json();
    console.log('📦 Request body:', body);
    
    const { postId, mediaUrls } = body;

    if (!postId) {
      console.error('❌ No postId provided');
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    console.log('🗑️ Deleting post:', postId);

    // Delete the post document from Firestore using Admin SDK
    try {
      await db.collection('blogs').doc(postId).delete();
      console.log('✅ Post document deleted from Firestore');
    } catch (firestoreError: any) {
      console.error('❌ Firestore deletion error:', firestoreError);
      throw new Error(`Firestore error: ${firestoreError.message}`);
    }

    // Delete associated media files from Storage
    if (mediaUrls && Array.isArray(mediaUrls) && mediaUrls.length > 0) {
      for (const url of mediaUrls) {
        try {
          const path = extractStoragePath(url);
          if (path) {
            const fileRef = ref(storage, path);
            await deleteObject(fileRef);
            console.log('✅ Deleted file:', path);
          }
        } catch (error) {
          console.error('Failed to delete media file:', url, error);
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Post deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post', details: error.message },
      { status: 500 }
    );
  }
}
