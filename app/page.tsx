
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CustomButton, CustomFormDialog, Input, PasswordInput } from '@/components/ui';
import { RequestAccessDialog } from '@/components/auth/request-access-dialog';
import { PrivacyPolicyDialog } from '@/components/auth/privacy-policy-dialog';
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
import { Loader2 } from 'lucide-react';


export default function Home() {
  const router = useRouter();
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, signIn, signOut, loading, platformAccess } = useAuth();

  useEffect(() => {
    // If the user is logged in (owner/leader), redirect them to the communities dashboard
    if (user) {
      router.replace('/communities');
    }
    // Show error if a member-only user attempted to log in
    if (platformAccess === 'denied') {
      setIsSignInOpen(true);
      setError('Access denied. This platform is for community owners and admins only. Please use kyozo.com to access your member account.');
    }
  }, [user, router, platformAccess]);


  const openWaitlist = () => {
    setIsSignInOpen(false);
    setIsResetPasswordOpen(false);
    setIsWaitlistOpen(true);
  };

  const openSignIn = () => {
    setIsWaitlistOpen(false);
    setIsResetPasswordOpen(false);
    setIsSignInOpen(true);
  };

  const openResetPassword = () => {
    setIsSignInOpen(false);
    setIsWaitlistOpen(false);
    setIsResetPasswordOpen(true);
  };

  const handleSignIn = async () => {
    setError(null);
    try {
      await signIn(email, password);
      // Platform access check happens in onAuthStateChanged — if denied, platformAccess will be 'denied'
      setIsSignInOpen(false);
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
  
    // Show spinner while auth or platform access check is in progress
    if (user || loading || platformAccess === 'loading') {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <header className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center z-20">
        <img src="/logo.svg" alt="Kyozo Logo" width={100} height={28} />
        {user ? (
          <CustomButton onClick={() => {
            signOut();
          }}>Sign Out</CustomButton>
        ) : (
          <CustomButton onClick={openSignIn}>Sign In</CustomButton>
        )}
      </header>

      {/* Floating Join Waitlist Button */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
        <CustomButton onClick={openWaitlist}>
          Join the waitlist
        </CustomButton>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="py-24 px-4 md:py-32 w-full">
          {/* <Hero
            text={["Discover your", "creative universe"]}
            gradientStart="#A07FBD"
            gradientEnd="#23AF98"
          /> */}
          
          {/* <section className="mt-24 space-y-12 mx-40">
            <FeatureCard
              title="No Likes No Followers Just Humans"
              description="Join and interact with diverse communities, from niche artistic circles to industry-leading collectives. Engage with passionate individuals who share your creative interests."
              buttonText="Join the waitlist"
              buttonAction={openWaitlist}
              color={THEME_COLORS.feed.primary}
              RightComponent={<IphoneMockup src="/Mobile-white.png" />}
              
            />
          </section> */}
          {/* <Hero text={["Where creative", "minds converge"]} />                   */}
          {/* <section className="mt-24 space-y-12 mx-40">            
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
          </section> */}
        </div>
        <Hero text={["We are", "a human network"]} />    
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

      {/* Footer */}
      <footer className="w-full py-12 px-8 text-center" style={{ backgroundColor: 'var(--page-bg-color, #FFF8F5)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground mb-6">
            <button type="button" onClick={() => setShowPrivacyDialog(true)} className="hover:underline">Privacy Policy</button>
            <a href="mailto:hello@kyozo.com" className="hover:underline">Contact</a>
          </div>
          <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Kyozo. All rights reserved.</p>
        </div>
      </footer>

      <RequestAccessDialog
        open={isWaitlistOpen}
        onOpenChange={setIsWaitlistOpen}
      />
      
      <CustomFormDialog 
        open={isSignInOpen} 
        onOpenChange={setIsSignInOpen}
        title="Welcome Back"
        description="Sign in to access your Kyozo dashboard and community."
      >
        <div className="flex flex-col h-full">
          <div className="flex-grow overflow-y-auto pr-2">
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
                  <p className="text-red-500 text-sm mt-2">{error}</p>
                )}
                <div className="text-right mt-2">
                  <button type="button" className="text-sm text-primary hover:underline" onClick={openResetPassword}>Forgot password?</button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex-shrink-0">
            <div className="mb-4">
              <CustomButton onClick={handleSignIn} className="w-full">Sign In</CustomButton>
            </div>

            <div className="text-center text-sm text-muted-foreground mt-4">
              Don&apos;t have access? <button type="button" className="text-primary hover:underline" onClick={openWaitlist}>Join the waitlist</button>
            </div>
          </div>
        </div>
      </CustomFormDialog>

      <ResetPasswordDialog
        open={isResetPasswordOpen}
        onOpenChange={setIsResetPasswordOpen}
        onGoBack={openSignIn}
      />

      <PrivacyPolicyDialog 
        open={showPrivacyDialog} 
        onOpenChange={setShowPrivacyDialog}
      />
    </div>
  );
}
