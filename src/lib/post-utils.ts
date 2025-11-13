import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { storage } from '@/firebase/storage';
import { ref, deleteObject } from 'firebase/storage';

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
          // Extract the path from the URL
          const path = decodeURIComponent(url.split('/o/')[1].split('?')[0]);
          const fileRef = ref(storage, path);
          await deleteObject(fileRef);
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
