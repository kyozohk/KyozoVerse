import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getStorage, Storage } from 'firebase-admin/storage';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { randomUUID } from 'crypto';

// Check if we should use mock mode for development
const useMockAdmin = process.env.USE_MOCK_ADMIN === 'true';

// Mock implementations for development without Firebase Admin credentials
class MockStorage {
  bucket(name?: string) {
    const bucketName = name || process.env.FIREBASE_STORAGE_BUCKET || 'kyozoverse.appspot.com';
    return {
      file: (path: string) => ({
        getSignedUrl: async (options: { action: 'write' | 'read', expires: number, contentType: string }) => {
          // In mock mode, we generate a fake URL that won't work but allows the flow to continue.
          // For a real upload test, you'd need actual credentials.
          const fakeSignedUrl = `https://storage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(path)}?alt=media&token=${randomUUID()}&mock=true`;
          return [fakeSignedUrl];
        },
      }),
      name: bucketName,
    };
  }
}


class MockAuth {
  async verifyIdToken(token: string) {
    console.log('Mock verifyIdToken:', token.substring(0, 10) + '...');
    return { uid: 'mock-user-id' };
  }
}

class MockFirestore {
  collection() {
    return {
      doc: () => ({
        set: async () => console.log('Mock document set'),
        get: async () => ({
          exists: true,
          data: () => ({
            /* mock data */
          })
        })
      })
    };
  }
}

// Initialize Firebase Admin SDK
function initAdmin(): App {
  if (useMockAdmin) {
    console.log('Using mock Firebase Admin SDK');
    return {} as App;
  }

  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }
  
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
      console.warn("FIREBASE_SERVICE_ACCOUNT_KEY not found. Using mock admin SDK. Set USE_MOCK_ADMIN=false and provide credentials for real implementation.");
      return {} as App; // Fallback to mock if no credentials
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    return initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (error) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", error);
      console.warn("Falling back to mock admin SDK due to credential parsing error.");
      return {} as App;
  }
}

// Determine if we are actually using mock based on initialization success
const adminApp = initAdmin();
const actuallyUsingMock = !adminApp.name;

// Export the services (real or mock)
export const adminAuth: Auth = actuallyUsingMock ? new MockAuth() as unknown as Auth : getAuth(adminApp);
export const adminFirestore: Firestore = actuallyUsingMock ? new MockFirestore() as unknown as Firestore : getFirestore(adminApp);
export const adminStorage: Storage = actuallyUsingMock ? new MockStorage() as unknown as Storage : getStorage(adminApp);

export default adminApp;
