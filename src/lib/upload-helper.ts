import { getAuth } from 'firebase/auth';

/**
 * Upload a file using a server-generated signed URL to bypass CORS issues.
 */
export async function uploadFile(file: File, communityId: string): Promise<string> {
  try {
    console.log('Starting server-signed upload for file:', file.name);
    
    // Get the current user's ID token
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const token = await user.getIdToken();
    console.log('Got user token, requesting signed URL');

    // 1. Get a signed URL from our new API route
    const signedUrlResponse = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        communityId: communityId,
      }),
    });

    if (!signedUrlResponse.ok) {
      const errorData = await signedUrlResponse.json();
      throw new Error(errorData.error || 'Could not get signed URL');
    }

    const { signedUrl, publicUrl } = await signedUrlResponse.json();
    console.log('Received signed URL, starting upload to GCS');

    // 2. Upload the file directly to Google Cloud Storage using the signed URL
    const uploadResponse = await fetch(signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('GCS Upload Error:', errorText);
      throw new Error('File upload to Google Cloud Storage failed.');
    }
    
    console.log('Upload successful, public URL:', publicUrl);
    return publicUrl;

  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}
