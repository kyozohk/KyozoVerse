import { initializeApp, getApps, getApp, FirebaseOptions } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

function initializeFirebase() {
  if (typeof window === 'undefined') {
    // On the server, we don't want to initialize the app.
    // This is a client-side only library.
    return { app: null, firestore: null, auth: null };
  }

  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const firestore = getFirestore(app);
  const auth = getAuth(app);
  
  return { app, firestore, auth };
}

let firebaseServices: { app: any; firestore: Firestore | null, auth: Auth | null };

export function getFirebase() {
  if (!firebaseServices) {
    firebaseServices = initializeFirebase();
  }
  return firebaseServices;
}

export * from './provider';

    