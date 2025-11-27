
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getStorage, Storage } from 'firebase-admin/storage';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { randomUUID } from 'crypto';

// Check if we should use mock mode for development
const useMockAdmin = process.env.USE_MOCK_ADMIN === 'true' || !process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

// Mock implementations for development without Firebase Admin credentials
class MockStorage {
  bucket(name?: string) {
    const bucketName = name || process.env.FIREBASE_STORAGE_BUCKET || 'kyozoverse.appspot.com';
    console.log(`[MockStorage] Using bucket: ${bucketName}`);
    return {
      file: (path: string) => {
        console.log(`[MockStorage] Creating file reference for: ${path}`);
        return {
          getSignedUrl: async (options: { action: 'write' | 'read', expires: number, contentType: string }) => {
            console.log(`[MockStorage] Generating mock signed URL for ${options.action}`);
            // In mock mode, we generate a fake URL that won't work but allows the flow to continue.
            // For a real upload test, you'd need actual credentials.
            const fakeSignedUrl = `https://storage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(path)}?alt=media&token=${randomUUID()}&mock=true`;
            console.log(`[MockStorage] Generated URL: ${fakeSignedUrl.substring(0, 100)}...`);
            return [fakeSignedUrl];
          },
        };
      },
      name: bucketName,
    };
  }
}

class MockAuth {
  async verifyIdToken(token: string) {
    console.log('[MockAuth] Mock verifyIdToken:', token.substring(0, 10) + '...');
    return { uid: 'mock-user-id' };
  }
   async createUser(user: any) {
    console.log('[MockAuth] Mock createUser:', user.email);
    return { uid: `mock-uid-${Math.random()}` };
  }
  async getUserByEmail(email: string) {
    console.log('[MockAuth] Mock getUserByEmail:', email);
    return { uid: `mock-uid-${Math.random()}` };
  }
}

class MockFirestore {
  collection() {
    return {
      doc: () => ({
        set: async () => console.log('[MockFirestore] Mock document set'),
        get: async () => ({
          exists: true,
          data: () => ({
            /* mock data */
          })
        })
      }),
      batch: () => ({
        set: () => {},
        commit: async () => console.log('[MockFirestore] Mock batch commit'),
      })
    };
  }
  batch() {
    return {
      set: () => {},
      commit: async () => console.log('[MockFirestore] Mock batch commit'),
    }
  }
}

// Initialize Firebase Admin SDK
function initAdmin(): App {
  if (getApps().length > 0 && !useMockAdmin) {
    return getApps()[0];
  }

  if (useMockAdmin) {
    console.log('Using mock Firebase Admin SDK because USE_MOCK_ADMIN is true or FIREBASE_SERVICE_ACCOUNT_KEY is not set.');
    if (getApps().length === 0) {
        initializeApp({ projectId: 'mock-project' });
    }
    return getApps()[0];
  }
  
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY!;

  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    return initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (error) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", error);
      console.warn("Falling back to mock admin SDK due to credential parsing error.");
      if (getApps().length === 0) {
        initializeApp({ projectId: 'mock-project-error' });
      }
      return getApps()[0];
  }
}

const adminApp = initAdmin();
const actuallyUsingMock = useMockAdmin || adminApp.options.credential === undefined;

// Export the services (real or mock)
export const adminAuth: Auth = actuallyUsingMock ? new MockAuth() as unknown as Auth : getAuth(adminApp);
export const adminFirestore: Firestore = actuallyUsingMock ? new MockFirestore() as unknown as Firestore : getFirestore(adminApp);
export const adminStorage: Storage = actuallyUsingMock ? new MockStorage() as unknown as Storage : getStorage(adminApp);

export { initAdmin };
export default adminApp;
