
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signInAnonymously as firebaseSignInAnonymously
} from 'firebase/auth';
import { app } from './config';

export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => {
  return signInWithPopup(auth, googleProvider);
};

export const signUpWithEmail = (email: string, password: string, details: { [key: string]: any }):Promise<any> => {
    return createUserWithEmailAndPassword(auth, email, password);
}

export const signInWithEmailPassword = (email: string, password: string):Promise<any> => {
    return signInWithEmailAndPassword(auth, email, password);
}

export const signOut = () => {
  return firebaseSignOut(auth);
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Anonymous authentication
export const signInAnonymously = async (): Promise<any> => {
  return await firebaseSignInAnonymously(auth);
};

export const resetPassword = (email: string) => {
  return sendPasswordResetEmail(auth, email);
};
