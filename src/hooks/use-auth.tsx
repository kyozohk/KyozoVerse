
"use client";

import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithEmailPassword, resetPassword as firebaseResetPassword, signUpWithEmail, signOut as firebaseSignOut } from '@/firebase/auth';
import { collection, query, where, getDocs, limit, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';

type PlatformAccess = 'loading' | 'granted' | 'denied' | null;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  platformAccess: PlatformAccess;
  setUser: (user: User | null) => void;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, details: { [key: string]: any }) => Promise<any>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  platformAccess: null,
  setUser: () => {},
  signIn: () => Promise.reject('signIn function not implemented'),
  signUp: () => Promise.reject('signUp function not implemented'),
  resetPassword: () => Promise.reject('resetPassword function not implemented'),
  signOut: () => Promise.reject('signOut function not implemented'),
});

/**
 * Checks if a user has platform-level access to pro.kyozo.com.
 * Each check is isolated so a Firestore error on one path doesn't block others.
 */
async function checkPlatformAccess(uid: string, email: string): Promise<boolean> {
  // Check 1 (fast path): Original workspace owner — owns at least one community
  try {
    const ownedQ = query(
      collection(db, 'communities'),
      where('ownerId', '==', uid),
      limit(1)
    );
    const ownedSnap = await getDocs(ownedQ);
    if (!ownedSnap.empty) return true;
  } catch (e) {
    console.error('[PlatformAccess] Community ownership check failed:', e);
  }

  // Check 2: Active workspace member record (invited users)
  try {
    const wsQ = query(
      collection(db, 'workspaceMembers'),
      where('userId', '==', uid),
      where('status', '==', 'active'),
      limit(1)
    );
    const wsSnap = await getDocs(wsQ);
    if (!wsSnap.empty) return true;
  } catch (e) {
    console.error('[PlatformAccess] Workspace member check failed:', e);
  }

  // Check 3: Pending invitation matching this email — auto-activate on first login
  if (email) {
    try {
      const pendingQ = query(
        collection(db, 'workspaceMembers'),
        where('email', '==', email.toLowerCase()),
        where('status', '==', 'pending'),
        limit(1)
      );
      const pendingSnap = await getDocs(pendingQ);
      if (!pendingSnap.empty) {
        const inviteDocRef = doc(db, 'workspaceMembers', pendingSnap.docs[0].id);
        await updateDoc(inviteDocRef, {
          userId: uid,
          status: 'active',
          updatedAt: new Date(),
        });
        return true;
      }
    } catch (e) {
      console.error('[PlatformAccess] Pending invite check failed:', e);
    }
  }

  return false;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [platformAccess, setPlatformAccess] = useState<PlatformAccess>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Public paths that don't require owner authentication
      const isPublicPath = pathname === '/' || 
                          pathname.startsWith('/c/') || 
                          pathname.startsWith('/invite');

      if (!firebaseUser) {
        setUser(null);
        setPlatformAccess(null);
        setLoading(false);
        if (!isPublicPath) {
          router.replace('/');
        }
        return;
      }

      // User is authenticated — now check platform-level access
      setPlatformAccess('loading');
      const hasAccess = await checkPlatformAccess(firebaseUser.uid, firebaseUser.email || '');

      if (!hasAccess) {
        // Member-only user: sign them out immediately
        console.warn('[PlatformAccess] Denied — user is not an owner or admin:', firebaseUser.uid);
        setPlatformAccess('denied');
        await firebaseSignOut();
        setUser(null);
        setLoading(false);
        return;
      }

      // Access granted
      setUser(firebaseUser);
      setPlatformAccess('granted');
      setLoading(false);

      if (pathname === '/') {
        router.replace('/communities');
      }
    });

    return () => unsubscribe();
  }, [router, pathname]);

  const signIn = async (email: string, password: string) => {
    const result = await signInWithEmailPassword(email, password);
    // Platform access check is handled in onAuthStateChanged above
    return result;
  };

  const signUp = (email: string, password: string, details: { [key: string]: any }) => {
    return signUpWithEmail(email, password, details);
  };

  const resetPassword = (email: string) => {
    return firebaseResetPassword(email);
  };

  const signOut = async () => {
    await firebaseSignOut();
    setUser(null);
    setPlatformAccess(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, loading, platformAccess, setUser, signIn, signUp, resetPassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
