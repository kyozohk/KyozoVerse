
// A placeholder for your Firebase Storage bucket name.
// Replace this with your actual bucket name.
const BUCKET_NAME = 'your-firebase-storage-bucket-name.appspot.com';

/**
 * Constructs a public URL for a file in Firebase Storage.
 *
 * NOTE: This function assumes that the files in your bucket are publicly readable.
 * If your storage rules are not public, you will need to use the
 * getDownloadURL() function from the Firebase SDK to generate a URL with an
 * access token.
 *
 * @param path The path to the file in your Firebase Storage bucket.
 * @returns A public URL to the file.
 */
export function getStorageUrl(path: string | undefined): string {
    if (!path) {
        return '';
    }

    // If the path is already a full URL, return it as is.
    if (path.startsWith('http')) {
        return path;
    }

    // Construct the full URL for the file in Firebase Storage.
    return `https://firebasestorage.googleapis.com/v0/b/${BUCKET_NAME}/o/${encodeURIComponent(path)}?alt=media`;
}
