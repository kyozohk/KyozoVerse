
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CustomButton, CustomFormDialog, Input, PasswordInput } from '@/components/ui';
import { RequestAccessDialog } from '@/components/auth/request-access-dialog';
import { ResetPasswordDialog } from '@/components/auth/reset-password-dialog';
import { useAuth } from '@/hooks/use-auth';
import { FirebaseError } from 'firebase/app';
import { Hero } from '@/components/landing/hero';
import FeatureCard from '@/components/ui/feature-card';
import VideoWall from '@/components/landing/video-wall';
import { IphoneMockup } from '@/components/landing/iphone-mockup';
import { ParallaxGrid } from '@/components/landing/parallax-grid';
import BubbleMarquee from '@/components/landing/bubble-marquee';
import ScrollRevealText from '@/components/landing/scroll-reveal-text';
import AnimatedTitle from '@/components/landing/animated-title';
import BottomText from '@/components/landing/bottom-text';
import { THEME_COLORS } from '@/lib/theme-colors';


export default function Home() {
  const router = useRouter();
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const { user, signIn, signOut, signUp } = useAuth();

  useEffect(() => {
    // If the user is logged in, redirect them to the dashboard
    if (user) {
      router.replace('/communities');
    }
  }, [user, router]);


  const openWaitlist = () => {
    setIsSignInOpen(false);
    setIsSignUpOpen(false);
    setIsResetPasswordOpen(false);
    setIsWaitlistOpen(true);
  };

  const openSignIn = () => {
    setIsWaitlistOpen(false);
    setIsSignUpOpen(false);
    setIsResetPasswordOpen(false);
    setIsSignInOpen(true);
  };

  const openSignUp = () => {
    setIsWaitlistOpen(false);
    setIsSignInOpen(false);
    setIsResetPasswordOpen(false);
    setIsSignUpOpen(true);
  };

  const openResetPassword = () => {
    setIsSignInOpen(false);
    setIsSignUpOpen(false);
    setIsWaitlistOpen(false);
    setIsResetPasswordOpen(true);
  };

  const handleSignIn = async () => {
    setError(null);
    try {
      await signIn(email, password);
      setIsSignInOpen(false);
      // The auth provider will handle the redirect
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
    setSignUpError(null);
    try {
      if (!signUpName || !signUpEmail || !signUpPassword) {
        setSignUpError("Please fill in all fields.");
        return;
      }
      if (signUpPassword.length < 6) {
        setSignUpError("Password must be at least 6 characters.");
        return;
      }
      await signUp(signUpEmail, signUpPassword, { displayName: signUpName });
      setIsSignUpOpen(false);
      // The auth provider will handle the redirect
    } catch (error: any) {
        let description = "An unexpected error occurred. Please try again.";
        if (error instanceof FirebaseError) {
            if (error.code === 'auth/email-already-in-use') {
                description = "This email is already registered. Please sign in instead.";
            } else if (error.code === 'auth/invalid-email') {
                description = "Invalid email address.";
            } else if (error.code === 'auth/weak-password') {
                description = "Password is too weak. Please use a stronger password.";
            }
        }
        setSignUpError(description);
    }
  };
  
    // If the user is logged in, we render null while the useEffect redirects
    if (user) {
        return null;
    }

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <header className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center z-20">
        <Image src="/logo.png" alt="Kyozo Logo" width={100} height={28} />
        {user ? (
          <CustomButton onClick={() => {
            signOut();
          }}>Sign Out</CustomButton>
        ) : (
          <CustomButton onClick={openSignIn}>Sign In</CustomButton>
        )}
      </header>

      {/* Floating Join Waitlist Button */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
        <CustomButton onClick={openWaitlist}>
          Join the waitlist
        </CustomButton>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="py-24 px-4 md:py-32 w-full">
          <Hero text={["Discover your", "creative universe"]} />    
          
          <section className="mt-24 space-y-12 mx-40">
            <FeatureCard
              title="No Likes No Followers Just Humans"
              description="Join and interact with diverse communities, from niche artistic circles to industry-leading collectives. Engage with passionate individuals who share your creative interests."
              buttonText="Join the waitlist"
              buttonAction={openWaitlist}
              color={THEME_COLORS.feed.primary}
              RightComponent={<IphoneMockup src="/Mobile-white.png" />}
              
            />
          </section>
          <Hero text={["Where creative", "minds converge"]} />                  
          <section className="mt-24 space-y-12 mx-40">            
            <FeatureCard
              title="Exclusive access and insights"
              description="Experience the creative world through an insider's lens. Kyozo is an eco-system of creative communities - that gives you exclusive access to updates and insights from the creative luminaries driving cultural evolution."
              buttonText="Join the waitlist"
              buttonAction={openWaitlist}
              color={THEME_COLORS.broadcast.primary}
              RightComponent={<VideoWall />}
            />
             <FeatureCard
              title="Engage with visionary communities"
              description="Join and interact with diverse communities, from niche artistic circles to industry-leading collectives. Engage with passionate individuals who share your creative interests."
              buttonText="Join the waitlist"
              buttonAction={openWaitlist}
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

      <RequestAccessDialog
        open={isWaitlistOpen}
        onOpenChange={setIsWaitlistOpen}
      />
      
      <CustomFormDialog 
        open={isSignInOpen} 
        onClose={() => setIsSignInOpen(false)}
        title="Welcome Back"
        description="Sign in to access your Kyozo dashboard and community."
        backgroundImage="/bg/light_app_bg.png"
        color={THEME_COLORS.overview.primary}
      >
        <div className="flex flex-col h-full">
          <div className="flex-grow">
            <div className="space-y-4">
              <Input 
                label="Email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div>
                <PasswordInput 
                  label="Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <div className="text-center text-sm text-secondary mt-4">
              Want to create communities? <button type="button" className="text-primary hover:underline" onClick={openSignUp}>Sign Up</button>
            </div>
            <div className="text-center text-sm text-secondary mt-2">
              Just browsing? <button type="button" className="text-primary hover:underline" onClick={openWaitlist}>Join the waitlist</button>
            </div>
          </div>
        </div>
      </CustomFormDialog>

      <CustomFormDialog 
        open={isSignUpOpen} 
        onClose={() => setIsSignUpOpen(false)}
        title="Create Your Account"
        description="Sign up to create and manage your own communities on Kyozo."
        backgroundImage="/bg/light_app_bg.png"
        color={THEME_COLORS.overview.primary}
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              value={signUpName}
              onChange={(e) => setSignUpName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
            />
            <Input
              label="Email"
              type="email"
              value={signUpEmail}
              onChange={(e) => setSignUpEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
            />
            <PasswordInput
              label="Password"
              value={signUpPassword}
              onChange={(e) => setSignUpPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
            />
          </div>
          {signUpError && (
            <div className="text-sm text-red-500 bg-red-50 p-3 rounded">
              {signUpError}
            </div>
          )}
          
          <div className="mt-6">
            <div className="mb-4">
              <CustomButton onClick={handleSignUp} className="w-full">Create Account</CustomButton>
            </div>

            <div className="text-center text-sm text-secondary mt-4">
              Already have an account? <button type="button" className="text-primary hover:underline" onClick={openSignIn}>Sign In</button>
            </div>
            <div className="text-center text-sm text-secondary mt-2">
              Just browsing? <button type="button" className="text-primary hover:underline" onClick={openWaitlist}>Join the waitlist</button>
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
