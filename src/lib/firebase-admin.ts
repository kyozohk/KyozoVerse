import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  // Try to use individual credential fields first (more reliable)
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  
  if (projectId && clientEmail && privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
        }),
      });
      console.log('✅ Firebase Admin initialized with individual credentials');
    } catch (error) {
      console.error('❌ Failed to initialize with individual credentials:', error);
      throw new Error('Invalid Firebase credentials');
    }
  }
  // Fallback to service account JSON
  else {
    const saRaw = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (saRaw) {
      try {
        // Replace escaped newlines with actual newlines for proper JSON parsing
        const saFixed = saRaw.replace(/\\n/g, '\n');
        const serviceAccount = JSON.parse(saFixed);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('✅ Firebase Admin initialized with service account JSON');
      } catch (error) {
        console.error('❌ Failed to parse service account:', error);
        throw new Error('Invalid Firebase service account credentials');
      }
    } 
    // Fallback to default credentials (works in Cloud environments)
    else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      console.log('✅ Firebase Admin initialized with application default credentials');
    }
    // No credentials found - throw error
    else {
      throw new Error(
        '❌ Firebase Admin SDK: No credentials found. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.'
      );
    }
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
export default admin;
