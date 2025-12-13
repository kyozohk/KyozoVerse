
'use client';

import { useState, useEffect, useContext, createContext, ReactNode, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { communityAuth } from '@/firebase/community-auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { joinCommunity } from '@/lib/community-utils';
import { useParams } from 'next/navigation';
import { FirebaseError } from 'firebase/app';

interface AuthAndDialogContextType {
  user: User | null;
  loading: boolean;
  dialogState: DialogState;
  setDialogState: (state: DialogState) => void;
  formState: FormState;
  handleFormChange: (field: keyof FormState, value: string) => void;
  handleCheckboxChange: (field: keyof FormState, value: boolean) => void;
  handleSignUp: () => Promise<void>;
  handleSignIn: () => Promise<void>;
  handleSignInWithGoogle: () => Promise<void>;
  handleSignOut: () => Promise<void>;
  handleToggleMode: () => void;
}

interface DialogState {
  isSignInOpen: boolean;
  isSignUpOpen: boolean;
  isResetPasswordOpen: boolean;
  showPrivacyPolicy: boolean;
}

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  agreedToPrivacy: boolean;
  error: string | null;
}

const AuthAndDialogContext = createContext<AuthAndDialogContextType | undefined>(undefined);

export const AuthAndDialogProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const params = useParams();
  const handle = params.handle as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogState, setDialogState] = useState<DialogState>({
    isSignInOpen: false,
    isSignUpOpen: false,
    isResetPasswordOpen: false,
    showPrivacyPolicy: false,
  });

  const [formState, setFormState] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    agreedToPrivacy: false,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(communityAuth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleFormChange = (field: keyof FormState, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value, error: null }));
  };
  
  const handleCheckboxChange = (field: keyof FormState, value: boolean) => {
    setFormState(prev => ({ ...prev, [field]: value, error: null }));
  };

  const resetForm = () => {
    setFormState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        agreedToPrivacy: false,
        error: null,
    });
  }

  const handleSignUp = async () => {
    setFormState(prev => ({ ...prev, error: null }));

    console.log('🔐 SIGNUP - Starting signup process');
    console.log('🔐 SIGNUP - Community handle:', handle);
    console.log('🔐 SIGNUP - Form data:', {
      firstName: formState.firstName,
      lastName: formState.lastName,
      email: formState.email,
      phone: formState.phone
    });

    if (!formState.agreedToPrivacy) {
        setFormState(prev => ({ ...prev, error: "You must agree to the privacy policy." }));
        return;
    }
    
    try {
      console.log('🔐 SIGNUP - Creating user account...');
      const userCredential = await createUserWithEmailAndPassword(communityAuth, formState.email, formState.password);
      const user = userCredential.user;
      console.log('✅ SIGNUP - User created:', user.uid);
      
      await updateProfile(user, { displayName: `${formState.firstName} ${formState.lastName}` });

      console.log('💾 SIGNUP - Creating user document in Firestore...');
      await setDoc(doc(db, "users", user.uid), {
        userId: user.uid,
        email: formState.email,
        firstName: formState.firstName,
        lastName: formState.lastName,
        displayName: `${formState.firstName} ${formState.lastName}`,
        phoneNumber: formState.phone,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('✅ SIGNUP - User document created');

      // Join the current community
      console.log('🏘️ SIGNUP - Joining community with handle:', handle);
      
      // First, get the community ID from the handle
      const { getCommunityByHandle } = await import('@/lib/community-utils');
      const communityData = await getCommunityByHandle(handle);
      
      if (!communityData) {
        console.error('❌ SIGNUP - Community not found for handle:', handle);
        throw new Error('Community not found');
      }
      
      console.log('🏘️ SIGNUP - Found community:', communityData.communityId, communityData.name);
      
      await joinCommunity(user.uid, communityData.communityId, {
        displayName: `${formState.firstName} ${formState.lastName}`,
        email: formState.email,
      });
      console.log('✅ SIGNUP - Successfully joined community');

      toast({ title: "Welcome!", description: "Your account has been created." });
      setDialogState({ ...dialogState, isSignUpOpen: false });
      resetForm();
    } catch (error: any) {
        if (error instanceof FirebaseError) {
            if (error.code === 'auth/email-already-in-use') {
                setFormState(prev => ({ ...prev, error: "This email is already in use. Please sign in." }));
            } else {
                setFormState(prev => ({ ...prev, error: "Could not create account. Please try again." }));
            }
        } else {
            setFormState(prev => ({ ...prev, error: "An unexpected error occurred." }));
        }
    }
  };

  const handleSignIn = async () => {
    setFormState(prev => ({ ...prev, error: null }));
    try {
      await signInWithEmailAndPassword(communityAuth, formState.email, formState.password);
      toast({ title: "Signed In", description: "Welcome back!" });
      setDialogState({ ...dialogState, isSignInOpen: false });
      resetForm();
    } catch (error) {
      setFormState(prev => ({ ...prev, error: "Invalid credentials. Please try again." }));
    }
  };
  
  const handleSignInWithGoogle = async () => {
    setFormState(prev => ({...prev, error: null}));
    try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(communityAuth, provider);
        setDialogState({ isSignInOpen: false, isSignUpOpen: false, isResetPasswordOpen: false, showPrivacyPolicy: false});
        toast({ title: 'Signed In', description: 'Welcome!'});
    } catch (error) {
        setFormState(prev => ({ ...prev, error: 'Could not sign in with Google. Please try again.'}));
    }
  };

  const handleSignOut = async () => {
    await firebaseSignOut(communityAuth);
    toast({ title: "Signed Out" });
  };
  
  const handleToggleMode = () => {
    setDialogState(prev => ({ ...prev, isSignInOpen: !prev.isSignInOpen, isSignUpOpen: !prev.isSignUpOpen }));
    resetForm();
  }

  const value = {
    user,
    loading,
    dialogState,
    setDialogState,
    formState,
    handleFormChange,
    handleCheckboxChange,
    handleSignUp,
    handleSignIn,
    handleSignInWithGoogle,
    handleSignOut,
    handleToggleMode
  };

  return (
    <AuthAndDialogContext.Provider value={value}>
      {children}
    </AuthAndDialogContext.Provider>
  );
};

export const useAuthAndDialog = () => {
  const context = useContext(AuthAndDialogContext);
  if (context === undefined) {
    throw new Error('useAuthAndDialog must be used within an AuthAndDialogProvider');
  }
  return context;
};
