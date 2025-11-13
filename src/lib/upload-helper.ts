import { getAuth } from 'firebase/auth';

/**
 * Upload a file using the server-side API to bypass CORS issues
 */
export async function uploadFile(file: File, communityId: string): Promise<string> {
  try {
    console.log('Starting server-side upload for file:', file.name);
    // Get the current user's ID token
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const token = await user.getIdToken();
    console.log('Got user token, preparing form data');
    
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('communityId', communityId);
    formData.append('userId', user.uid);
    formData.append('token', token);
    
    console.log('Sending upload request to server API');
    // Upload using the simple server API
    const response = await fetch('/api/upload-simple', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
            errorData = JSON.parse(errorText);
        } catch (e) {
            console.error('Failed to parse error response:', errorText);
            errorData = { error: 'Unknown server error' };
        }
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log('Upload successful, URL:', data.url);
    return data.url;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

/**
 * Try direct upload first, fall back to server upload if CORS error occurs
 */
export async function smartUpload(
  file: File, 
  communityId: string, 
  directUploadFn: (file: File) => Promise<string>
): Promise<string> {
  try {
    // Try direct upload first
    return await directUploadFn(file);
  } catch (error: any) {
    // Check if it's a CORS error
    if (
      error.message?.includes('CORS') || 
      error.name === 'AbortError' ||
      error.code === 'storage/unauthorized'
    ) {
      console.warn('Direct upload failed due to CORS, falling back to server upload');
      return await uploadFile(file, communityId);
    }
    // Re-throw other errors
    throw error;
  }
}
