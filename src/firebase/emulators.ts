import { connectStorageEmulator } from 'firebase/storage';
import { connectFirestoreEmulator } from 'firebase/firestore';
import { connectAuthEmulator } from 'firebase/auth';
import { storage } from './storage';
import { db } from './firestore';
import { auth } from './auth';

// Only connect to emulators in development and when explicitly enabled
const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

export function connectToEmulators() {
  if (useEmulators && typeof window !== 'undefined') {
    // Check if we're already connected to avoid double connection
    if (process.env.NODE_ENV === 'development') {
      try {
        console.log('Connecting to Firebase emulators...');
        
        // Connect to Auth emulator
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
        
        // Connect to Firestore emulator
        connectFirestoreEmulator(db, 'localhost', 8080);
        
        // Connect to Storage emulator
        connectStorageEmulator(storage, 'localhost', 9199);
        
        console.log('Connected to Firebase emulators');
      } catch (error) {
        console.error('Error connecting to emulators:', error);
      }
    }
  }
}
