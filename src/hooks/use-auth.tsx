
"use client";

import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithEmailPassword, resetPassword as firebaseResetPassword, signUpWithEmail, signOut as firebaseSignOut } from '@/firebase/auth';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, details: { [key: string]: any }) => Promise<any>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  signIn: () => Promise.reject('signIn function not implemented'),
  signUp: () => Promise.reject('signUp function not implemented'),
  resetPassword: () => Promise.reject('resetPassword function not implemented'),
  signOut: () => Promise.reject('signOut function not implemented'),
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      
      // Public paths that don't require owner authentication
      const isPublicPath = pathname === '/' || 
                          pathname === '/pro' || 
                          pathname.startsWith('/c/') || 
                          pathname.startsWith('/invite') ||
                          pathname.match(/^\/[^/]+$/); // Matches /[handle] routes
      
      // Owner logged in on /pro page - redirect to pro communities
      if (firebaseUser && pathname === '/pro') {
        router.replace('/pro/communities');
      } 
      // Not logged in trying to access protected owner routes
      else if (!firebaseUser && !isPublicPath && pathname.startsWith('/pro/')) {
        router.replace('/pro');
      }
    });

    return () => unsubscribe();
  }, [router, pathname]);

  const signIn = (email: string, password: string) => {
    return signInWithEmailPassword(email, password);
  };

  const signUp = (email: string, password: string, details: { [key: string]: any }) => {
    return signUpWithEmail(email, password, details);
  };

  const resetPassword = (email: string) => {
    return firebaseResetPassword(email);
  };

  const signOut = async () => {
    await firebaseSignOut();
    router.push('/');
  }

  return (
    <AuthContext.Provider value={{ user, loading, setUser, signIn, signUp, resetPassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
