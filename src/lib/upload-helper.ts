import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
export async function uploadFile(file: File, communityId: string): Promise<string | UploadResponse> {
  try {
    console.log('Starting server-side upload for file:', file.name, 'Type:', file.type, 'Size:', file.size);
    
    // Validate file type
    if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
      console.log('Detected media file type:', file.type);
      
      // Additional validation for audio/video files
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
              
              // Return the full response object if it contains additional metadata
              if (response.fileType || response.fileCategory) {
                console.log('Upload response includes metadata:', { 
                  fileType: response.fileType, 
                  fileCategory: response.fileCategory 
                });
                resolve({
                  url: response.url,
                  fileType: response.fileType,
                  fileCategory: response.fileCategory
                });
              } else {
                // For backward compatibility, return just the URL string
                resolve(response.url);
              }
            } else {
              console.error('Upload response error:', response);
              reject(new Error(response.error || 'Upload failed: No URL returned'));
            }
          } catch (e) {
            console.error('Failed to parse response:', xhr.responseText);
            reject(new Error('Invalid response format'));
          }
        } else {
          let errorMessage = `Upload failed with status ${xhr.status}`;
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            if (errorResponse.message) {
              errorMessage = errorResponse.message;
            }
            console.error('Server error response:', errorResponse);
          } catch (e) {
            // If we can't parse the error response, use the default message
            console.error('Raw error response:', xhr.responseText);
          }
          reject(new Error(errorMessage));
        }
      };
      
      xhr.onerror = () => {
        console.error('Network error during upload');
        reject(new Error('Network error during upload'));
      };
      
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
