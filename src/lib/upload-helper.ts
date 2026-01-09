import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/firebase/storage';

/**
 * Upload file response type
 */
interface UploadResponse {
  url: string;
  fileType?: string;
  fileCategory?: string;
}

/**
 * Upload a file using the server-side API
 */
export async function uploadFile(file: File, pathPrefix: string): Promise<string | UploadResponse> {
  try {
    console.log(`Starting server-side upload for file: ${file.name}, Type: ${file.type}, Size: ${file.size}`);
    
    // Validate file type
    if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        throw new Error('File size exceeds the maximum allowed (100MB)');
      }
    }
    
    // Get the current user
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Use pathPrefix to create a full path
    const fullPath = `${pathPrefix}/${Date.now()}-${file.name}`;
    
    // Upload directly using client-side SDK
    const storageRef = ref(storage, fullPath);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    console.log('Upload successful, URL:', url);
    
    return {
      url: url,
      fileType: file.type,
      fileCategory: file.type.split('/')[0]
    };

  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

/**
 * Delete a file from Firebase Storage by its URL
 */
export async function deleteFileByUrl(url: string): Promise<void> {
  if (!url) return;

  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
    console.log(`File deleted successfully from: ${url}`);
  } catch (error: any) {
    // It's common for this to fail if the URL isn't a direct storage ref,
    // so we handle it gracefully.
    if (error.code === 'storage/object-not-found') {
      console.warn(`File not found at ${url}, it may have already been deleted.`);
    } else {
      console.error(`Failed to delete file from URL ${url}:`, error);
      // We don't re-throw because failing to delete an old file
      // shouldn't block the user's current action (e.g., saving a post).
    }
  }
}
