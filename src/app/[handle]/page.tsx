'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, orderBy, doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { FeedSkeletons } from '@/components/community/feed/skeletons';
import { getCommunityByHandle } from '@/lib/community-utils';
import { type Post, type Community } from '@/lib/types';
import { TextPostCard } from '@/components/community/feed/text-post-card';
import { AudioPostCard } from '@/components/community/feed/audio-post-card';
import { VideoPostCard } from '@/components/community/feed/video-post-card';
import Image from 'next/image';
import Link from 'next/link';
import { useCommunityAuth } from '@/hooks/use-community-auth';
import { CustomButton, Input, PasswordInput, Checkbox } from '@/components/ui';
import { PrivacyPolicyDialog } from '@/components/auth/privacy-policy-dialog';
import { useToast } from '@/hooks/use-toast';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { communityAuth } from '@/firebase/community-auth';

export default function PublicFeedPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const handle = params.handle as string;

  const [posts, setPosts] = useState<(Post & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [communityData, setCommunityData] = useState<Community | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSignup, setIsSignup] = useState(true);
  
  // Initialize from URL params using lazy initialization
  const [firstName, setFirstName] = useState(() => searchParams.get('firstName') || '');
  const [lastName, setLastName] = useState(() => searchParams.get('lastName') || '');
  const [phone, setPhone] = useState(() => searchParams.get('phone') || '');
  const [email, setEmail] = useState(() => searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  
  const { user: communityUser, signOut } = useCommunityAuth();
  const { toast } = useToast();
  
  // Use ref to track if we've already processed URL params
  const hasProcessedParams = useRef(false);

  // Handle URL params and open dialog - FIXED VERSION
  useEffect(() => {
    // Only process once
    if (hasProcessedParams.current) return;
    
    const signup = searchParams.get('signup');
    const signin = searchParams.get('signin');
    
    if (signup !== null) {
      setIsDialogOpen(true);
      setIsSignup(true);
      hasProcessedParams.current = true;
    } else if (signin !== null) {
      setIsDialogOpen(true);
      setIsSignup(false);
      hasProcessedParams.current = true;
    }
  }, [searchParams]); // Only searchParams in deps, NOT the state variables!

  useEffect(() => {
    async function fetchCommunityData() {
      if (!handle) return;
      setLoading(true);
      try {
        const data = await getCommunityByHandle(handle);
        setCommunityData(data);
      } catch (error) {
        console.error('Error fetching community data:', error);
      }
    }
    fetchCommunityData();
  }, [handle]);

  useEffect(() => {
    if (!handle || !communityData) return;

    const postsRef = collection(db, 'blogs');
    const publicQuery = query(
      postsRef,
      where('communityHandle', '==', handle),
      where('visibility', '==', 'public'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(publicQuery, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (Post & { id: string })[];
      
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching posts:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [handle, communityData]);

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
      
      setIsDialogOpen(false);
      router.replace(`/${handle}`);
    } catch (error: any) {
      console.error('Signup error:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Please sign in instead.");
        setIsSignup(false);
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
      
      if (communityData?.communityId) {
        const docId = `${userCredential.user.uid}_${communityData.communityId}`;
        await setDoc(doc(db, 'communityMembers', docId), {
          id: docId,
          userId: userCredential.user.uid,
          communityId: communityData.communityId,
          role: 'member',
          joinedAt: new Date(),
          userDetails: {
            displayName: userCredential.user.displayName || email,
            email: userCredential.user.email || email,
          }
        }, { merge: true });
      }
      
      toast({
        title: "Welcome back!",
        description: "You're now signed in.",
      });
      
      setIsDialogOpen(false);
      router.replace(`/${handle}`);
    } catch (error: any) {
      console.error('Signin error:', error);
      setError(error.message || "Invalid email or password.");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(communityAuth, provider);
      
      const userRef = doc(db, 'users', result.user.uid);
      await setDoc(userRef, {
        userId: result.user.uid,
        displayName: result.user.displayName || '',
        email: result.user.email || '',
        createdAt: new Date(),
      }, { merge: true });
      
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
      
      setIsDialogOpen(false);
      router.replace(`/${handle}`);
    } catch (error: any) {
      console.error('Google signin error:', error);
      setError(error.message || "Failed to sign in with Google.");
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setError(null);
  };

  const renderPost = (post: Post & { id: string }) => {
    const postProps = { ...post, _isPublicView: true };
    switch (post.type) {
      case 'text':
      case 'image':
        return <TextPostCard key={post.id} post={postProps} />;
      case 'audio':
        return <AudioPostCard key={post.id} post={postProps} />;
      case 'video':
        return <VideoPostCard key={post.id} post={postProps} />;
      default:
        return null;
    }
  };
  
  return (
    <>
      {/* Signup/Signin Overlay */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md mx-4">
            {/* Close Button */}
            <button
              onClick={() => {
                setIsDialogOpen(false);
                router.replace(`/${handle}`);
              }}
              className="absolute -top-2 -right-2 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Form Card */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="text-center mb-6">
                {communityData?.communityProfileImage && (
                  <Image
                    src={communityData.communityProfileImage}
                    alt={communityData.name || handle}
                    width={80}
                    height={80}
                    className="mx-auto rounded-full mb-4"
                  />
                )}
                <h2 className="text-3xl font-bold mb-2" style={{ color: '#843484' }}>
                  {isSignup ? 'Join' : 'Sign In to'} {communityData?.name || handle}
                </h2>
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
              <div className="space-y-4 [&_input]:border-purple-300 [&_input]:focus:border-purple-500 [&_input]:focus:ring-purple-500">
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

                <CustomButton
                  onClick={isSignup ? handleSignUp : handleSignIn}
                  className="w-full"
                >
                  {isSignup ? 'Sign Up' : 'Sign In'}
                </CustomButton>

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
                <CustomButton
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
                </CustomButton>

                {/* Toggle Mode */}
                <div className="text-center text-sm text-gray-600">
                  {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-[#843484] hover:underline font-medium"
                  >
                    {isSignup ? 'Sign In' : 'Sign Up'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/bg/feed_bg.png)' }}
      >
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/30 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto max-w-4xl px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {communityData?.communityProfileImage && (
              <Image 
                src={communityData.communityProfileImage} 
                alt={communityData.name || handle} 
                width={40} 
                height={40} 
                className="rounded-full"
              />
            )}
            <div>
              <h1 className="text-xl font-bold text-white">{communityData?.name || handle}</h1>
              <p className="text-sm text-gray-300">{posts.length} posts</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {communityUser ? (
              <>
                <span className="text-white text-sm hidden sm:inline">
                  {communityUser.displayName || communityUser.email}
                </span>
                <CustomButton onClick={handleSignOut} variant="outline" className="text-white border-white">
                  Sign Out
                </CustomButton>
              </>
            ) : (
              <>
                <Link href={`/${handle}/join`}>
                  <CustomButton className="bg-purple-600 hover:bg-purple-700 text-white">
                    Join Community
                  </CustomButton>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Feed Content */}
      <main className="container mx-auto max-w-4xl px-4 py-8">
        {loading ? (
          <FeedSkeletons />
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white text-lg">No posts yet</p>
            <p className="text-gray-400 mt-2">Check back later for updates</p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
            {posts.map(renderPost)}
          </div>
        )}
      </main>
    </div>

    <PrivacyPolicyDialog
      open={showPrivacyDialog}
      onOpenChange={setShowPrivacyDialog}
    />
  </>
  );
}
