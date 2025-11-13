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
    // Upload using the server API with progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.open('POST', '/api/upload', true);
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          console.log(`Upload progress: ${percentComplete}%`);
        }
      };
      
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('Upload successful, URL:', response.url);
            resolve(response.url);
          } catch (e) {
            console.error('Failed to parse response:', xhr.responseText);
            reject(new Error('Invalid response from server'));
          }
        } else {
          let errorMessage = 'Upload failed';
          try {
            const errorData = JSON.parse(xhr.responseText);
            errorMessage = errorData.error || `Upload failed with status ${xhr.status}`;
          } catch (e) {
            console.error('Failed to parse error response:', xhr.responseText);
          }
          reject(new Error(errorMessage));
        }
      };
      
      xhr.onerror = function() {
        reject(new Error('Network error during upload'));
      };
      
      xhr.send(formData);
    });
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
