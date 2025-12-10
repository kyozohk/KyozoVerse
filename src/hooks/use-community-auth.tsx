
'use client';

import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signOut as firebaseSignOut,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { communityAuth } from '@/firebase/community-auth';

interface CommunityAuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
}

const CommunityAuthContext = createContext<CommunityAuthContextType>({
  user: null,
  loading: true,
  signIn: () => Promise.reject('signIn function not implemented'),
  signOut: () => Promise.reject('signOut function not implemented'),
});

export const CommunityAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(communityAuth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(communityAuth, email, password);
    return userCredential.user;
  }

  const signOut = async () => {
    await firebaseSignOut(communityAuth);
  }

  return (
    <CommunityAuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </CommunityAuthContext.Provider>
  );
};

export const useCommunityAuth = () => useContext(CommunityAuthContext);
