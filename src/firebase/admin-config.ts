import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getStorage, Storage } from 'firebase-admin/storage';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { randomUUID } from 'crypto';

// Check if we should use mock mode for development
const useMockAdmin = process.env.USE_MOCK_ADMIN === 'true';

// Mock implementations for development without Firebase Admin credentials
class MockStorage {
  bucket() {
    return {
      file: (path: string) => ({
        getSignedUrl: async () => [`https://storage.googleapis.com/kyozoverse.appspot.com/${encodeURIComponent(path)}?alt=media&token=${randomUUID()}`],
        createWriteStream: () => {
          const events: Record<string, Function[]> = {};
          const stream = {
            on: (event: string, callback: Function) => {
              if (!events[event]) events[event] = [];
              events[event].push(callback);
              return stream;
            },
            end: (buffer: Buffer) => {
              console.log(`Mock file upload: ${path} (${buffer.length} bytes)`);
              setTimeout(() => {
                if (events['finish']) events['finish'].forEach(cb => cb());
              }, 500);
              return stream;
            }
          };
          return stream;
        }
      })
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
    // Return existing initialized app
    return apps[0];
  }

  // Check if we're running in a Firebase environment (like Cloud Functions)
  // where the admin SDK is automatically initialized
  try {
    return initializeApp();
  } catch (e) {
    // Not in a Firebase environment, initialize with credentials
    
    // For local development, use service account credentials
    // For production, use default credentials
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID || '',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\n/g, '\n'),
    };

    return initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  }
}

// Initialize the app
const adminApp = initAdmin();

// Export the services (real or mock)
export const adminAuth: Auth = useMockAdmin ? new MockAuth() as unknown as Auth : getAuth(adminApp);
export const adminFirestore: Firestore = useMockAdmin ? new MockFirestore() as unknown as Firestore : getFirestore(adminApp);
export const adminStorage: Storage = useMockAdmin ? new MockStorage() as unknown as Storage : getStorage(adminApp);

export default adminApp;
