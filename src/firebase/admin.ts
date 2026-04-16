
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

/**
 * Initialize Firebase Admin SDK
 */
export function initAdmin() {
  if (!admin.apps.length) {
    try {
      // Try to parse service account if available
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
      
      if (serviceAccountKey) {
        let serviceAccount: any;
        try {
          serviceAccount = JSON.parse(serviceAccountKey);
        } catch {
          // Some environments inject the JSON with literal newlines inside the private_key string,
          // which breaks JSON.parse with "Bad control character".
          serviceAccount = JSON.parse(serviceAccountKey.replace(/\n/g, '\\n'));
        }

        if (serviceAccount?.private_key && typeof serviceAccount.private_key === 'string') {
          serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else if (projectId && clientEmail && privateKeyRaw) {
        const privateKey = privateKeyRaw
          .replace(/^"|"$/g, '')
          .replace(/\\n/g, '\n');

        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
      } else {
        // For development, use a minimal config with a project ID
        admin.initializeApp({
          projectId: 'kyozoverse-dev',
          databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://kyozoverse-dev.firebaseio.com'
        });
        console.warn('No FIREBASE_SERVICE_ACCOUNT_KEY found, using minimal config');
      }
    } catch (error) {
      console.error('Error initializing Firebase Admin:', error);
      // Initialize with minimal config as fallback
      admin.initializeApp({
        projectId: 'kyozoverse-dev'
      });
    }
  }
  return admin;
}

// Initialize Firebase Admin on module import
initAdmin();

// Export Firestore instance
const db = getFirestore();
const auth = getAuth();

export { admin, db, auth };
