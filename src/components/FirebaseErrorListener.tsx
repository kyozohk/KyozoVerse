'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useAuth } from '@/hooks/use-auth';

// This is a client component that will listen for permission errors
// and throw them to be caught by the Next.js error overlay.
// This is only active in development.
export function FirebaseErrorListener() {
  const { user } = useAuth();

  useEffect(() => {
    const handler = (error: FirestorePermissionError) => {
      if (process.env.NODE_ENV === 'development') {
        // Enrich the error with user data before throwing
        error.enrichWithAuth(user);
        
        // Use a timeout to ensure the error is thrown in a separate task
        setTimeout(() => {
          throw error;
        }, 0);
      }
    };

    errorEmitter.on('permission-error', handler);

    return () => {
      errorEmitter.off('permission-error', handler);
    };
  }, [user]);

  // This component does not render anything
  return null;
}
