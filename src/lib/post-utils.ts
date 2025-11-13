import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { storage } from '@/firebase/storage';
import { ref, deleteObject, getDownloadURL } from 'firebase/storage';

/**
 * Helper function to extract the storage path from a URL
 */
function extractStoragePath(url: string): string | null {
  console.log('Extracting path from URL:', url);
  
  try {
    // Case 1: Firebase Storage URL format
    if (url.includes('/o/')) {
      const path = decodeURIComponent(url.split('/o/')[1].split('?')[0]);
      console.log('Extracted path (Firebase format):', path);
      return path;
    }
    
    // Case 2: Direct path format
    if (url.includes('community-posts/')) {
      // Try to match the pattern: community-posts/COMMUNITY_ID/CATEGORY/TIMESTAMP-FILENAME
      const match = url.match(/community-posts\/[\w-]+\/[\w-]+\/[\d-]+[^?\s]+/);
      if (match) {
        console.log('Extracted path (direct format):', match[0]);
        return match[0];
      }
    }
    
    // Case 3: Full URL with domain
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    if (pathname.includes('community-posts/')) {
      const match = pathname.match(/community-posts\/[\w-]+\/[\w-]+\/[\d-]+[^?\s]+/);
      if (match) {
        console.log('Extracted path (URL pathname):', match[0]);
        return match[0];
      }
    }
    
    console.error('Could not extract path from URL:', url);
    return null;
  } catch (error) {
    console.error('Error extracting path:', error);
    return null;
  }
}

/**
 * Delete a post and its associated media files
 */
export async function deletePost(postId: string, mediaUrls?: string[]) {
  try {
    // Delete the post document from Firestore
    const postRef = doc(db, 'blogs', postId);
    await deleteDoc(postRef);
    
    // If the post has media files, delete them from Storage
    if (mediaUrls && mediaUrls.length > 0) {
      for (const url of mediaUrls) {
        try {
          console.log('Attempting to delete file from URL:', url);
          
          // Extract the path from the URL
          const path = extractStoragePath(url);
          
          if (!path) {
            console.error('Could not extract path from URL:', url);
            continue;
          }
          
          console.log('Extracted storage path:', path);
          const fileRef = ref(storage, path);
          await deleteObject(fileRef);
          console.log('Successfully deleted file from storage');
        } catch (error) {
          console.error(`Failed to delete media file: ${url}`, error);
          // Continue with other files even if one fails
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
}

/**
 * Update a post's content
 */
export async function updatePost(postId: string, updates: Partial<{ title: string; content: { text: string } }>) {
  try {
    const postRef = doc(db, 'blogs', postId);
    await updateDoc(postRef, updates);
    return true;
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
}
