
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
      
      if (serviceAccountKey) {
        const serviceAccount = JSON.parse(serviceAccountKey);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
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
