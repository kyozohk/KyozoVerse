
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { CustomButton, CustomFormDialog, Input, PasswordInput } from '@/components/ui';
import { ResetPasswordDialog } from '@/components/auth/reset-password-dialog';
import { useCommunityAuth } from '@/hooks/use-community-auth';
import { FirebaseError } from 'firebase/app';
import FeatureCard from '@/components/ui/feature-card';
import VideoWall from '@/components/landing/video-wall';
import { IphoneMockup } from '@/components/landing/iphone-mockup';
import { ParallaxGrid } from '@/components/landing/parallax-grid';
import BubbleMarquee from '@/components/landing/bubble-marquee';
import { THEME_COLORS } from '@/lib/theme-colors';
import { useToast } from '@/hooks/use-toast';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { communityAuth } from '@/firebase/community-auth';
import { Hero } from '@/components/landing/hero';

function MemberHomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { user: communityUser, signIn, signOut } = useCommunityAuth();

  // Check if there's a redirect parameter
  const redirectTo = searchParams.get('redirect');

  useEffect(() => {
    // If member is logged in and there's a redirect, go there
    // Otherwise redirect to communities page
    if (communityUser) {
      if (redirectTo) {
        router.replace(redirectTo);
      } else {
        router.replace('/communities');
      }
    }
  }, [communityUser, redirectTo, router]);

  const openSignIn = () => {
    setIsResetPasswordOpen(false);
    setIsSignInOpen(true);
  };

  const openResetPassword = () => {
    setIsSignInOpen(false);
    setIsResetPasswordOpen(true);
  };

  const handleSignIn = async () => {
    setError(null);
    try {
      const userCredential = await signIn(email, password);
      setIsSignInOpen(false);
      toast({
        title: "Welcome back!",
        description: "You're now signed in.",
      });
      
      // Redirect to the community feed if specified, otherwise to communities list
      if (redirectTo) {
        router.replace(redirectTo);
      } else {
        router.replace('/communities');
      }
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

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(communityAuth, provider);
      setIsSignInOpen(false);
      toast({
        title: "Welcome!",
        description: "You're now signed in with Google.",
      });
      
      // Redirect to the community feed if specified, otherwise to communities list
      if (redirectTo) {
        router.replace(redirectTo);
      } else {
        router.replace('/communities');
      }
    } catch (error: any) {
      let description = "An unexpected error occurred. Please try again.";
      if (error instanceof FirebaseError) {
        if (error.code === 'auth/popup-closed-by-user') {
          description = "Sign-in was cancelled.";
        } else if (error.code === 'auth/account-exists-with-different-credential') {
          description = "An account already exists with this email using a different sign-in method.";
        }
      }
      setError(description);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You've been signed out successfully.",
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      {/* Corner Circle Decoration */}
      <div className="absolute top-0 right-0 z-10 pointer-events-none">
        <Image src="/corner-cirlce.png" alt="" width={200} height={200} className="opacity-80" />
      </div>

      <header className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center z-20">
        <Image src="/logo.png" alt="Kyozo Logo" width={100} height={28} />
        {communityUser ? (
          <CustomButton onClick={handleSignOut}>Sign Out</CustomButton>
        ) : (
          <CustomButton onClick={openSignIn}>Sign In</CustomButton>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="py-24 px-4 md:py-32 w-full">
          <Hero text={["Discover your", "creative universe"]} />
          
          <section className="mt-24 space-y-12 mx-40">
            <FeatureCard
              title="No Likes No Followers Just Humans"
              description="Join and interact with diverse communities, from niche artistic circles to industry-leading collectives. Engage with passionate individuals who share your creative interests."
              buttonText="Explore Communities"
              buttonAction={openSignIn}
              color={THEME_COLORS.feed.primary}
              RightComponent={<IphoneMockup src="/Mobile-white.png" />}
            />
          </section>
          <Hero text={["Where creative", "minds converge"]} />
          <section className="mt-24 space-y-12 mx-40">            
            <FeatureCard
              title="Exclusive access and insights"
              description="Experience the creative world through an insider's lens. Kyozo is an eco-system of creative communities - that gives you exclusive access to updates and insights from the creative luminaries driving cultural evolution."
              buttonText="Get Started"
              buttonAction={openSignIn}
              color={THEME_COLORS.broadcast.primary}
              RightComponent={<VideoWall />}
            />
             <FeatureCard
              title="Engage with visionary communities"
              description="Join and interact with diverse communities, from niche artistic circles to industry-leading collectives. Engage with passionate individuals who share your creative interests."
              buttonText="Join Now"
              buttonAction={openSignIn}
              color={THEME_COLORS.overview.primary}
              RightComponent={<ParallaxGrid />}
            />            
          </section>
        </div>
        <Hero text={["We are", "human network"]} />
        {/* Edge-to-edge marquee */}
        <BubbleMarquee
          categories={[
            {
              category: 'inbox',
              items: [ { text: 'Dance' }, { text: 'Music' }, { text: 'House' }, { text: 'Techno' }, { text: 'Trance' }]
            },
            {
              category: 'overview',
              items: [ { text: 'Contemporary' }, { text: 'Surrealism' }, { text: 'Impressionism' }, { text: 'Art' }, { text: 'Cubism' }]
            },
            {
              category: 'broadcast',
              items: [ { text: 'Craft' }, { text: 'Pottery' }, { text: 'Drawing' }, { text: 'Painting' }, { text: 'Jewelry' }]
            },
            {
              category: 'members',
              items: [ { text: 'Haute Couture' }, { text: 'Fashion' }, { text: 'Streetwear' }, { text: 'Boho' }, { text: 'Avant Garde' }]
            },
            {
              category: 'feed',
              items: [ { text: 'Electronic' }, { text: 'Dance' }, { text: 'Performance' }, { text: 'House' }, { text: 'Techno' }, { text: 'Trance' }]
            }
          ]}
        />
        <Hero text={["Join the Kyozo", "creative universe"]} />
      </main>

      <CustomFormDialog 
        open={isSignInOpen} 
        onClose={() => setIsSignInOpen(false)}
        title="Welcome to Kyozo"
        description="Sign in to access exclusive content from your communities."
        backgroundImage="/bg/light_app_bg.png"
        color="#843484"
      >
        <div className="flex flex-col h-full">
          <div className="flex-grow">
            <div className="space-y-4">
              <Input 
                label="Email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
              />
              <div>
                <PasswordInput 
                  label="Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
                />
                {error && (
                  <p className="text-red-500 text-sm mt-2">
                    {error} <button type="button" className="text-primary hover:underline" onClick={openResetPassword}>Forgot password?</button>
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="mb-4">
              <CustomButton onClick={handleSignIn} className="w-full">Sign In</CustomButton>
            </div>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-gray-500">Or continue with</span>
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
                Sign in with Google
              </CustomButton>
            </div>

            <div className="text-center text-sm text-secondary mt-4">
              Are you a community owner? <a href="/pro" className="text-primary hover:underline">Sign in here</a>
            </div>
          </div>
        </div>
      </CustomFormDialog>

      <ResetPasswordDialog
        open={isResetPasswordOpen}
        onClose={() => setIsResetPasswordOpen(false)}
        onGoBack={openSignIn}
      />
    </div>
  );
}

export default function MemberHome() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MemberHomeContent />
    </Suspense>
  );
}
