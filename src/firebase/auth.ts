
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
  signInAnonymously as firebaseSignInAnonymously,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink as firebaseSignInWithEmailLink
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

// Email link authentication (passwordless)
export const sendSignInLink = async (email: string, redirectUrl: string): Promise<void> => {
  const actionCodeSettings = {
    url: redirectUrl,
    handleCodeInApp: true,
  };
  
  return await sendSignInLinkToEmail(auth, email, actionCodeSettings);
};

export const isEmailLink = (link: string): boolean => {
  return isEmailLink(auth, link);
};

export const signInWithEmailLink = async (email: string, link: string): Promise<any> => {
  return await firebaseSignInWithEmailLink(auth, email, link);
};

export const resetPassword = (email: string) => {
  return sendPasswordResetEmail(auth, email);
};
