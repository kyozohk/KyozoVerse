'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { FeedSkeletons } from '@/components/community/feed/skeletons';
import { getCommunityByHandle } from '@/lib/community-utils';
import { type Post, type User, type Community } from '@/lib/types';
import { TextPostCard } from '@/components/community/feed/text-post-card';
import { AudioPostCard } from '@/components/community/feed/audio-post-card';
import { VideoPostCard } from '@/components/community/feed/video-post-card';
import Image from 'next/image';
import { useCommunityAuth } from '@/hooks/use-community-auth';
import { CustomButton, CustomFormDialog, Input, PasswordInput, PhoneInput, Checkbox } from '@/components/ui';
import { PrivacyPolicyDialog } from '@/components/auth/privacy-policy-dialog';
import { THEME_COLORS } from '@/lib/theme-colors';
import { FirebaseError } from 'firebase/app';
import { useToast } from '@/hooks/use-toast';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { communityAuth } from '@/firebase/community-auth';

export default function PublicFeedPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const handle = params.handle as string;
  const showSignup = searchParams.get('signup') !== null;
  const showSignin = searchParams.get('signin') !== null;
  const isSignupMode = showSignup; // true = signup, false = signin

  const [posts, setPosts] = useState<(Post & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [communityData, setCommunityData] = useState<Community | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(showSignup || showSignin);
  const [isSignup, setIsSignup] = useState(isSignupMode);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  
  const { user: communityUser, signIn, signOut } = useCommunityAuth();

  // Update dialog state when URL changes
  useEffect(() => {
    setIsDialogOpen(showSignup || showSignin);
    setIsSignup(showSignup);
  }, [showSignup, showSignin]);

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
    if (!handle || !communityData) {
      return;
    }

    const postsCollection = collection(db, 'blogs');
    
    // Create separate queries for public and private posts
    // Then merge the results client-side
    const publicQuery = query(
      postsCollection,
      where('communityHandle', '==', handle),
      where('visibility', '==', 'public'),
      orderBy('createdAt', 'desc')
    );

    let unsubscribePublic: (() => void) | null = null;
    let unsubscribePrivate: (() => void) | null = null;
    
    const allPosts = new Map<string, Post & { id: string }>();
    
    const updatePosts = () => {
      const sortedPosts = Array.from(allPosts.values()).sort((a, b) => {
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return bTime - aTime;
      });
      setPosts(sortedPosts);
      setLoading(false);
    };

    const processSnapshot = async (querySnapshot: any) => {
      for (const postDoc of querySnapshot.docs) {
        const postData = postDoc.data() as Post;
        let authorData: User | null = null;
        if (postData.authorId) {
          try {
            const userRef = doc(db, 'users', postData.authorId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              authorData = userSnap.data() as User;
            }
          } catch (error) {
            // If we can't fetch author, proceed without it
          }
        }
        allPosts.set(postDoc.id, {
          id: postDoc.id,
          ...postData,
          author: authorData || { userId: 'unknown', displayName: 'Unknown User' },
          createdAt: postData.createdAt?.toDate(),
        });
      }
      updatePosts();
    };

    // Subscribe to public posts
    unsubscribePublic = onSnapshot(publicQuery, processSnapshot, (error) => {
      console.error('Error fetching public posts:', error);
      setLoading(false);
    });

    // If user is logged in, also subscribe to private posts
    if (communityUser && communityData.communityId) {
      const privateQuery = query(
        postsCollection,
        where('communityHandle', '==', handle),
        where('visibility', '==', 'private'),
        orderBy('createdAt', 'desc')
      );
      
      unsubscribePrivate = onSnapshot(privateQuery, processSnapshot, (error) => {
        console.error('Error fetching private posts:', error);
        // Don't set loading to false here, as public posts might still be loading
      });
    }

    return () => {
      unsubscribePublic?.();
      unsubscribePrivate?.();
    };
  }, [handle, communityData, communityUser]);

  const handleSignIn = async () => {
    setError(null);
    try {
      await signIn(email, password);
      setIsDialogOpen(false);
      router.replace(`/${handle}`);
      toast({
        title: "Welcome back!",
        description: "You're now signed in as a member.",
      });
    } catch (error: any) {
      let description = "An unexpected error occurred. Please try again.";
      if (error instanceof FirebaseError) {
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          description = "Invalid credentials. Please check your email and password and try again.";
        }
      }
      setError(description);
    }
  };

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
      // Clean phone number: remove + and spaces
      const cleanPhone = phone.replace(/[\s+]/g, '');
      
      // Create new user account with Firebase Auth
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
      const userCredential = await createUserWithEmailAndPassword(communityAuth, email, password);
      
      // Update user profile with display name
      await updateProfile(userCredential.user, {
        displayName: `${firstName} ${lastName}`
      });
      
      // Store user profile in Firestore
      const { setDoc } = await import('firebase/firestore');
      const userRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userRef, {
        userId: userCredential.user.uid,
        displayName: `${firstName} ${lastName}`,
        email: email,
        phone: cleanPhone,
        firstName: firstName,
        lastName: lastName,
        createdAt: new Date(),
      }, { merge: true });
      
      // Add user as a member of this community
      if (communityData?.communityId) {
        const { addDoc } = await import('firebase/firestore');
        const membersRef = collection(db, 'communityMembers');
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
            phone: cleanPhone,
          }
        });
        console.log('User added to community:', { userId: userCredential.user.uid, communityId: communityData.communityId });
      }
      
      console.log('User created:', { firstName, lastName, cleanPhone, email });
      
      setIsDialogOpen(false);
      router.replace(`/${handle}`);
      toast({
        title: "Welcome!",
        description: "You're now signed up and signed in.",
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      let description = "An unexpected error occurred. Please try again.";
      
      // Check for Firebase error code (works for both FirebaseError instances and plain error objects)
      const errorCode = error?.code || '';
      
      if (errorCode.includes('auth/email-already-in-use')) {
        description = "This email is already registered. Please sign in instead.";
      } else if (errorCode.includes('auth/invalid-email')) {
        description = "Invalid email address.";
      } else if (errorCode.includes('auth/weak-password')) {
        description = "Password is too weak. Please use a stronger password.";
      } else if (errorCode.includes('auth/operation-not-allowed')) {
        description = "Email/password sign up is not enabled. Please contact support.";
      } else if (errorCode.includes('auth/missing-password')) {
        description = "Please enter a password.";
      } else if (errorCode) {
        // Show the actual error code for debugging
        description = `Error: ${errorCode}`;
      } else if (error?.message) {
        description = `Error: ${error.message}`;
      }
      
      setError(description);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(communityAuth, provider);
      setIsDialogOpen(false);
      router.replace(`/${handle}`);
      toast({
        title: "Welcome!",
        description: "You're now signed in with Google.",
      });
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      let description = "An unexpected error occurred. Please try again.";
      
      // Check for Firebase error code
      const errorCode = error?.code || '';
      
      if (errorCode.includes('auth/popup-closed-by-user')) {
        description = "Sign-in was cancelled.";
      } else if (errorCode.includes('auth/account-exists-with-different-credential')) {
        description = "An account already exists with this email using a different sign-in method.";
      } else if (errorCode.includes('auth/unauthorized-domain')) {
        description = "This domain is not authorized for Google sign-in. Please contact support.";
      } else if (errorCode) {
        // Show the actual error code for debugging
        description = `Error: ${errorCode}`;
      } else if (error?.message) {
        description = `Error: ${error.message}`;
      }
      
      setError(description);
    }
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setError(null);
    setFirstName('');
    setLastName('');
    setPhone('');
    setEmail('');
    setPassword('');
    setAgreedToPrivacy(false);
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You've been signed out successfully.",
    });
  };

  const renderPost = (post: Post & { id: string }) => {
    const postProps = { ...post, _isPublicView: !communityUser };
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
      <CustomFormDialog 
        open={isDialogOpen} 
        onClose={() => {
          setIsDialogOpen(false);
          router.replace(`/${handle}`);
        }}
        title={isSignup ? "Join as Member" : "Sign In as Member"}
        description={isSignup ? `Join ${communityData?.name || handle} to access exclusive content` : `Sign in to access private content from ${communityData?.name || handle}`}
        backgroundImage="/bg/light_app_bg.png"
        color="#843484"
      >
        <div className="flex flex-col h-full">
          <div className="flex-grow">
            <div className="space-y-4">
              {isSignup && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      label="First Name" 
                      type="text" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
                    />
                    <Input 
                      label="Last Name" 
                      type="text" 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
                    />
                  </div>
                  <PhoneInput 
                    label="Phone Number" 
                    value={phone}
                    onChange={(value) => setPhone(value)}
                  />
                </>
              )}
              <Input 
                label="Email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (isSignup ? handleSignUp() : handleSignIn())}
              />
              <div>
                <PasswordInput 
                  label="Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (isSignup ? handleSignUp() : handleSignIn())}
                />
                {isSignup && (
                  <div className="mt-3">
                    <Checkbox
                      checked={agreedToPrivacy}
                      onCheckedChange={(checked) => setAgreedToPrivacy(checked === true)}
                      label={
                        <span className="text-sm text-gray-700">
                          I agree to the{' '}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setShowPrivacyDialog(true);
                            }}
                            className="text-primary hover:underline font-medium"
                          >
                            Privacy Policy
                          </button>
                        </span>
                      }
                    />
                  </div>
                )}
                {error && (
                  <p className="text-red-500 text-sm mt-2">{error}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="mb-4">
              <CustomButton onClick={isSignup ? handleSignUp : handleSignIn} className="w-full">
                {isSignup ? 'Sign Up' : 'Sign In'}
              </CustomButton>
            </div>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                {/* <div className="w-full border-t border-gray-300"></div> */}
              </div>
              <div 
                className="relative flex justify-center text-sm"
                // style={{
                //   backgroundImage: 'url(/bg/light_app_bg.png)',
                //   backgroundSize: 'cover',
                //   backgroundPosition: 'center'
                // }}
              >
                <span className="px-4 py-1 text-gray-700">Or continue with</span>
              </div>
            </div>

            <div className="mb-4">
              <CustomButton onClick={handleGoogleSignIn} className="w-full" variant="outline">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {isSignup ? 'Sign up' : 'Sign in'} with Google
              </CustomButton>
            </div>

            <div className="text-center text-sm text-secondary mt-4">
              {isSignup ? (
                <>
                  Already a member? <button type="button" className="text-primary hover:underline" onClick={toggleMode}>Sign In here</button>
                </>
              ) : (
                <>
                  New here? <button type="button" className="text-primary hover:underline" onClick={toggleMode}>Sign Up here</button>
                </>
              )}
            </div>
            {/* <div className="text-center text-sm text-secondary mt-2">
              Are you a community owner? <a href="/pro" className="text-primary hover:underline">Sign in here</a>
            </div> */}
          </div>
        </div>
      </CustomFormDialog>

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
                <h2 className="text-lg font-semibold text-white">@{handle}</h2>
                {communityData?.name && <p className="text-sm text-white/70">{communityData.name}</p>}
              </div>
            </div>
            
            <div>
              {communityUser ? (
                <CustomButton onClick={handleSignOut} variant="outline">Sign Out</CustomButton>
              ) : (
                <CustomButton onClick={() => router.push(`/${handle}?signin`)}>Sign In</CustomButton>
              )}
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="container mx-auto max-w-4xl px-4 pt-16 pb-8">
          <div className="overflow-hidden rounded-lg p-8">
            {communityData?.name && (
              <div className="mb-8 overflow-visible">
                <h1 className="text-5xl md:text-7xl font-bold" style={{ 
                  background: 'linear-gradient(to top right, #596086, #B2778C)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'inline-block',
                  paddingBottom: '0.2em',
                  lineHeight: '1.3'
                }}>{communityData.name}</h1>
                {communityData.mantras && <p className="text-xl text-gray-400 mt-2">{communityData.mantras}</p>}
                {communityData.lore && <p className="text-gray-400 mt-4">{communityData.lore}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Feed */}
        <main className="container mx-auto max-w-4xl px-4 py-8">
          {communityUser && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-400">
                ✓ You're signed in as a member. You can now see private content.
              </p>
            </div>
          )}
          
          <div className="space-y-6">
            {loading ? (
              <FeedSkeletons />
            ) : posts.length === 0 ? (
              <div className="rounded-lg bg-black/20 backdrop-blur-sm overflow-hidden">
                <div className="text-center py-16 px-4">
                  <h2 className="text-2xl font-bold text-white mb-4">No posts to display</h2>
                  <p className="text-white/70 max-w-md mx-auto">
                    {communityUser 
                      ? "There are no posts in this community yet."
                      : "There are no public posts in this community yet. Sign in to see more content."}
                  </p>
                </div>
              </div>
            ) : (
              posts.map(renderPost)
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-black/30 backdrop-blur-sm border-t border-gray-800 py-6 mt-12">
          <div className="container mx-auto max-w-4xl px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-white/60">
                © {new Date().getFullYear()} KyozoVerse
              </p>
              <div className="flex gap-6">
                <span className="text-sm text-white/60 hover:text-white cursor-pointer">
                  Terms
                </span>
                <span className="text-sm text-white/60 hover:text-white cursor-pointer">
                  Privacy
                </span>
                <span className="text-sm text-white/60 hover:text-white cursor-pointer">
                  Contact
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Privacy Policy Dialog */}
      <PrivacyPolicyDialog 
        open={showPrivacyDialog} 
        onOpenChange={setShowPrivacyDialog}
      />
    </>
  );
}
