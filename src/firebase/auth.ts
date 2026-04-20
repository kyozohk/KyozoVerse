
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

export const resetPassword = async (email: string) => {
  const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  // KYPRO-54: make the reset link bring users back to the current app (e.g. pro.kyozo.com),
  // not the default Firebase authDomain (which was landing users on www.kyozo.com).
  const actionCodeSettings = origin
    ? { url: `${origin}/?resetPassword=1`, handleCodeInApp: false }
    : undefined;

  console.log('[resetPassword]', JSON.stringify({
    requestId,
    stage: 'start',
    email: email.replace(/(.{2}).*@/, '$1***@'),
    origin,
    continueUrl: actionCodeSettings?.url || null,
  }));

  try {
    console.log('[resetPassword]', JSON.stringify({ requestId, stage: 'calling_firebase', authInstance: !!auth, authDomain: (auth as any)?.config?.authDomain || null }));
    const result = actionCodeSettings
      ? await sendPasswordResetEmail(auth, email, actionCodeSettings)
      : await sendPasswordResetEmail(auth, email);
    console.log('[resetPassword]', JSON.stringify({ requestId, stage: 'success', result: 'Firebase accepted reset email request' }));
    return result;
  } catch (error: any) {
    console.error('[resetPassword]', JSON.stringify({
      requestId,
      stage: 'error',
      errorCode: error?.code,
      errorMessage: error?.message,
      errorName: error?.name,
    }));
    throw error;
  }
};
