"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { AuthProvider } from '@/hooks/use-auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

export interface FirebaseServices {
  app: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
}

const FirebaseContext = createContext<FirebaseServices | undefined>(undefined);

export function FirebaseProvider({ children, ...services }: { children: ReactNode } & FirebaseServices) {
  return (
    <FirebaseContext.Provider value={services}>
      <AuthProvider>
        {children}
        {process.env.NODE_ENV === 'development' && <FirebaseErrorListener />}
      </AuthProvider>
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

export function useFirebaseApp() {
  return useFirebase().app;
}

export function useFirestore() {
  return useFirebase().firestore;
}

export function useAuth() {
  return useFirebase().auth;
}

    