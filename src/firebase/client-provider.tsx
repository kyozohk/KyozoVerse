"use client";

import React, { ReactNode } from 'react';
import { FirebaseProvider, type FirebaseServices } from './provider';

interface FirebaseClientProviderProps {
  children: ReactNode;
  firebase: FirebaseServices;
}

export function FirebaseClientProvider({ children, firebase }: FirebaseClientProviderProps) {
  // The purpose of this component is to ensure that the FirebaseProvider,
  // which holds the Firebase instances, is only rendered on the client.
  return <FirebaseProvider {...firebase}>{children}</FirebaseProvider>;
}

    