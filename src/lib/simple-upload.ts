import { getAuth } from 'firebase/auth';

/**
 * A simple upload helper that uses the server-side API to bypass CORS
 */
export async function simpleUpload(file: File, communityId: string): Promise<string> {
  try {
    console.log('Starting simple upload for file:', file.name);
    
    // Get the current user's ID token
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const token = await user.getIdToken();
    
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('communityId', communityId);
    formData.append('userId', user.uid);
    formData.append('token', token);
    
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
    console.log('Simple upload successful, URL:', data.url);
    return data.url;
  } catch (error) {
    console.error('Error in simple upload:', error);
    throw error;
  }
}
