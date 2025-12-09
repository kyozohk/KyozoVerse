'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Input, PasswordInput, PhoneInput, Button, Checkbox } from '@/components/ui';
import { PrivacyPolicyDialog } from '@/components/auth/privacy-policy-dialog';
import { getCommunityByHandle } from '@/lib/community-utils';
import { type Community } from '@/lib/types';
import { useCommunityAuth } from '@/hooks/use-community-auth';
import { useToast } from '@/hooks/use-toast';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { communityAuth } from '@/firebase/community-auth';
import { setDoc, doc, collection } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import Image from 'next/image';

export default function JoinCommunityPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const handle = params.handle as string;

  const [communityData, setCommunityData] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSignup, setIsSignup] = useState(true);
  
  // Initialize from URL params directly
  const [firstName, setFirstName] = useState(() => searchParams.get('firstName') || '');
  const [lastName, setLastName] = useState(() => searchParams.get('lastName') || '');
  const [phone, setPhone] = useState(() => searchParams.get('phone') || '');
  const [email, setEmail] = useState(() => searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  
  const { signIn } = useCommunityAuth();

  // Load community data
  useEffect(() => {
    async function fetchCommunityData() {
      if (!handle) return;
      setLoading(true);
      try {
        const data = await getCommunityByHandle(handle);
        setCommunityData(data);
      } catch (error) {
        console.error('Error fetching community data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCommunityData();
  }, [handle]);

  const handleSignUp = async () => {
    setError(null);
    try {
      if (!firstName || !lastName || !phone || !email || !password) {
        setError("Please fill in all fields.");
        return;
      }
      if (!agreedToPrivacy) {
        setError("Please agree to the Privacy Policy to continue.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }

      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
      const userCredential = await createUserWithEmailAndPassword(communityAuth, email, password);
      
      await updateProfile(userCredential.user, {
        displayName: `${firstName} ${lastName}`
      });
      
      // Save user data
      const userRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userRef, {
        userId: userCredential.user.uid,
        displayName: `${firstName} ${lastName}`,
        email: email,
        phone: phone,
        firstName: firstName,
        lastName: lastName,
        createdAt: new Date(),
      }, { merge: true });
      
      // Add to community
      if (communityData?.communityId) {
        const docId = `${userCredential.user.uid}_${communityData.communityId}`;
        await setDoc(doc(db, 'communityMembers', docId), {
          id: docId,
          userId: userCredential.user.uid,
          communityId: communityData.communityId,
          role: 'member',
          joinedAt: new Date(),
          userDetails: {
            displayName: `${firstName} ${lastName}`,
            email: email,
            phone: phone,
          }
        });
      }
      
      toast({
        title: "Welcome!",
        description: "You're now signed up and signed in.",
      });
      
      router.push(`/${handle}`);
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Check if email already exists
      if (error.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Please sign in instead.");
        setIsSignup(false); // Switch to sign-in mode
        return;
      }
      
      setError(error.message || "An error occurred. Please try again.");
    }
  };

  const handleSignIn = async () => {
    setError(null);
    try {
      if (!email || !password) {
        setError("Please enter email and password.");
        return;
      }

      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const userCredential = await signInWithEmailAndPassword(communityAuth, email, password);
      
      // Add to community if not already a member
      if (communityData?.communityId) {
        const docId = `${userCredential.user.uid}_${communityData.communityId}`;
        await setDoc(doc(db, 'communityMembers', docId), {
          id: docId,
          userId: userCredential.user.uid,
          communityId: communityData.communityId,
          role: 'member',
          joinedAt: new Date(),
          userDetails: {
            displayName: userCredential.user.displayName || `${firstName} ${lastName}` || email,
            email: userCredential.user.email || email,
            phone: phone || '',
          }
        }, { merge: true }); // Use merge to not overwrite existing data
      }
      
      toast({
        title: "Welcome back!",
        description: "You're now signed in.",
      });
      
      router.push(`/${handle}`);
    } catch (error: any) {
      console.error('Signin error:', error);
      setError(error.message || "Invalid email or password.");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(communityAuth, provider);
      
      // Save user data
      const userRef = doc(db, 'users', result.user.uid);
      await setDoc(userRef, {
        userId: result.user.uid,
        displayName: result.user.displayName || '',
        email: result.user.email || '',
        createdAt: new Date(),
      }, { merge: true });
      
      // Add to community
      if (communityData?.communityId) {
        const docId = `${result.user.uid}_${communityData.communityId}`;
        await setDoc(doc(db, 'communityMembers', docId), {
          id: docId,
          userId: result.user.uid,
          communityId: communityData.communityId,
          role: 'member',
          joinedAt: new Date(),
          userDetails: {
            displayName: result.user.displayName || '',
            email: result.user.email || '',
          }
        });
      }
      
      toast({
        title: "Welcome!",
        description: "You're now signed in with Google.",
      });
      
      router.push(`/${handle}`);
    } catch (error: any) {
      console.error('Google signin error:', error);
      setError(error.message || "Failed to sign in with Google.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat relative" style={{ backgroundImage: 'url(/bg/light_app_bg.png)' }}>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            {communityData?.communityProfileImage && (
              <Image
                src={communityData.communityProfileImage}
                alt={communityData.name}
                width={80}
                height={80}
                className="mx-auto rounded-full mb-4"
              />
            )}
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#843484' }}>
              {isSignup ? 'Join' : 'Sign In to'} {communityData?.name || handle}
            </h1>
            <p className="text-gray-600">
              {isSignup 
                ? 'Create your account to access exclusive content' 
                : 'Welcome back! Sign in to continue'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {/* Form */}
          <div className="space-y-4">
            {isSignup && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="First Name"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    required
                  />
                  <Input
                    label="Last Name"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    required
                  />
                </div>
                <Input
                  label="Phone Number"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1234567890"
                  required
                />
              </>
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              required
            />

            <PasswordInput
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />

            {isSignup && (
              <div className="flex items-start gap-2">
                <Checkbox
                  checked={agreedToPrivacy}
                  onCheckedChange={(checked) => setAgreedToPrivacy(checked as boolean)}
                />
                <label className="text-sm text-gray-600">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setShowPrivacyDialog(true)}
                    className="text-[#843484] hover:underline"
                  >
                    Privacy Policy
                  </button>
                </label>
              </div>
            )}

            <Button
              onClick={isSignup ? handleSignUp : handleSignIn}
              className="w-full"
              style={{ backgroundColor: '#843484' }}
            >
              {isSignup ? 'Sign Up' : 'Sign In'}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Google Sign In */}
            <Button
              onClick={handleGoogleSignIn}
              variant="outline"
              className="w-full"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </Button>

            {/* Toggle Mode */}
            <div className="text-center text-sm text-gray-600">
              {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => setIsSignup(!isSignup)}
                className="text-[#843484] hover:underline font-medium"
              >
                {isSignup ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Policy Dialog */}
      <PrivacyPolicyDialog
        open={showPrivacyDialog}
        onOpenChange={setShowPrivacyDialog}
      />
    </div>
  );
}
