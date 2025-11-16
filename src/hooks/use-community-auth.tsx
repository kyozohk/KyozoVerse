
'use client';

import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { communityAuth } from '@/firebase/community-auth';

interface CommunityAuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const CommunityAuthContext = createContext<CommunityAuthContextType>({
  user: null,
  loading: true,
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

  const signOut = async () => {
    await firebaseSignOut(communityAuth);
  }

  return (
    <CommunityAuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </CommunityAuthContext.Provider>
  );
};

export const useCommunityAuth = () => useContext(CommunityAuthContext);
