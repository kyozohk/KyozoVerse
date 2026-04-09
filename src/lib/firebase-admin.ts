import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // Try to initialize with service account from environment variable
    const saRaw = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (saRaw) {
      try {
        let serviceAccount: any;
        // Try parsing directly first (JSON with \n as two-char escape sequences)
        try {
          serviceAccount = JSON.parse(saRaw);
        } catch {
          // The env var contains actual control characters (literal newlines, etc.)
          // Replace them with proper JSON escape sequences
          const sanitized = saRaw
            .replace(/\r\n/g, '\\n')  // Windows CRLF → \n escape
            .replace(/\r/g, '\\n')     // Old Mac CR → \n escape
            .replace(/\n/g, '\\n');    // Unix LF → \n escape
          serviceAccount = JSON.parse(sanitized);
        }
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
        console.log('✅ Firebase Admin initialized with service account');
      } catch (parseError) {
        console.error('❌ Failed to parse service account JSON:', parseError);
        throw new Error('Invalid service account JSON. Check FIREBASE_SERVICE_ACCOUNT env variable.');
      }
    } 
    // Fallback to default credentials (works in Cloud environments)
    else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      console.log('✅ Firebase Admin initialized with application default credentials');
    }
    // For local development without credentials
    else {
      console.warn('⚠️ Firebase Admin SDK: No credentials found. Some features may not work.');
      // Initialize without credentials for basic functionality
      admin.initializeApp({
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
    // Re-throw to prevent using uninitialized admin
    throw error;
  }
}

// Only export if admin is initialized
if (!admin.apps.length) {
  throw new Error('Firebase Admin SDK failed to initialize');
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export default admin;
