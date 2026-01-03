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
 * Upload a file using the server-side API or directly from client
 */
export async function uploadFile(file: File, path: string): Promise<string | UploadResponse> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error('User not authenticated');
  }

  const storageRef = ref(storage, `${path}/${Date.now()}-${file.name}`);
  const uploadResult = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(uploadResult.ref);
  
  return url;
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
