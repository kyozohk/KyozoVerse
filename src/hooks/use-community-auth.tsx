'use client';

import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  sendSignInLinkToEmail, 
  isSignInWithEmailLink, 
  signInWithEmailLink,
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { communityAuth } from '@/firebase/community-auth';

interface CommunityAuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string) => Promise<any>;
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
    
    // Handle email link sign-in
    if (isSignInWithEmailLink(communityAuth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Please provide your email for confirmation');
      }
      if(email){
        signInWithEmailLink(communityAuth, email, window.location.href)
          .then((result) => {
            window.localStorage.removeItem('emailForSignIn');
            setUser(result.user);
          })
          .catch((error) => {
            console.error('Error signing in with email link:', error);
          });
      }
    }

    return () => unsubscribe();
  }, []);

  const signIn = (email: string) => {
    const actionCodeSettings = {
      url: window.location.href,
      handleCodeInApp: true,
    };
    window.localStorage.setItem('emailForSignIn', email);
    return sendSignInLinkToEmail(communityAuth, email, actionCodeSettings);
  };

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
