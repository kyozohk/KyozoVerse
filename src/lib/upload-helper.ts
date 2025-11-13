import { getAuth } from 'firebase/auth';

/**
 * Upload a file using the server-side API
 */
export async function uploadFile(file: File, communityId: string): Promise<string> {
  try {
    console.log('Starting server-side upload for file:', file.name);
    // Get the current user
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('communityId', communityId);
    
    console.log('Sending upload request to server API');
    
    // Create an XMLHttpRequest to track upload progress
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Set up progress tracking
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          console.log(`Upload progress: ${progress}%`);
        }
      };
      
      // Create a promise to handle the XHR request
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success && response.url) {
              console.log('Upload successful, URL:', response.url);
              resolve(response.url);
            } else {
              reject(new Error('Upload failed: No URL returned'));
            }
          } catch (e) {
            reject(new Error('Invalid response format'));
          }
        } else {
          let errorMessage = `Upload failed with status ${xhr.status}`;
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            if (errorResponse.message) {
              errorMessage = errorResponse.message;
            }
          } catch (e) {
            // If we can't parse the error response, use the default message
          }
          reject(new Error(errorMessage));
        }
      };
      
      xhr.onerror = () => reject(new Error('Network error during upload'));
      
      // Open and send the request
      xhr.open('POST', '/api/upload');
      xhr.setRequestHeader('x-user-id', user.uid);
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}
