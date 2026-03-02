
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CustomButton, CustomFormDialog, Input, PasswordInput, PhoneInput, Checkbox } from '@/components/ui';
import { RequestAccessDialog } from '@/components/auth/request-access-dialog';
import { PrivacyPolicyDialog } from '@/components/auth/privacy-policy-dialog';
import { ResetPasswordDialog } from '@/components/auth/reset-password-dialog';
import { EmailVerificationDialog } from '@/components/auth/email-verification-dialog';
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
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpFirstName, setSignUpFirstName] = useState('');
  const [signUpLastName, setSignUpLastName] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [pendingSignUpData, setPendingSignUpData] = useState<{
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
  } | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const { user, signIn, signOut, signUp, loading } = useAuth();

  useEffect(() => {
    // If the user is logged in (owner/leader), redirect them to the communities dashboard
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
    console.log('🔐 [SIGNUP] Starting signup process...');
    setSignUpError(null);
    try {
      console.log('🔐 [SIGNUP] Form data:', { 
        firstName: signUpFirstName, 
        lastName: signUpLastName, 
        email: signUpEmail, 
        phone: signUpPhone,
        passwordLength: signUpPassword?.length,
        agreedToPrivacy 
      });
      
      if (!signUpFirstName || !signUpLastName || !signUpPhone || !signUpEmail || !signUpPassword) {
        console.log('🔐 [SIGNUP] ERROR: Missing required fields');
        setSignUpError("Please fill in all fields.");
        return;
      }
      if (!agreedToPrivacy) {
        console.log('🔐 [SIGNUP] ERROR: Privacy policy not agreed');
        setSignUpError("Please agree to the Privacy Policy to continue.");
        return;
      }
      if (signUpPassword.length < 6) {
        console.log('🔐 [SIGNUP] ERROR: Password too short');
        setSignUpError("Password must be at least 6 characters.");
        return;
      }
      
      setIsSigningUp(true);
      console.log('🔐 [SIGNUP] Validation passed, sending verification code...');
      
      // Send verification code first
      console.log('🔐 [SIGNUP] Calling /api/send-verification-code with:', { email: signUpEmail, firstName: signUpFirstName });
      const response = await fetch('/api/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: signUpEmail, 
          firstName: signUpFirstName 
        }),
      });
      
      console.log('🔐 [SIGNUP] API response status:', response.status);
      const data = await response.json();
      console.log('🔐 [SIGNUP] API response data:', data);
      
      if (!response.ok) {
        console.error('🔐 [SIGNUP] ERROR: API returned error:', data);
        throw new Error(data.error || 'Failed to send verification code');
      }
      
      console.log('🔐 [SIGNUP] SUCCESS: Verification code sent, emailId:', data.emailId);
      
      // Store pending signup data
      setPendingSignUpData({
        email: signUpEmail,
        password: signUpPassword,
        firstName: signUpFirstName,
        lastName: signUpLastName,
        phone: signUpPhone,
      });
      
      // Close signup dialog and open verification dialog
      setIsSignUpOpen(false);
      setIsVerificationOpen(true);
      
    } catch (error: any) {
        let description = "An unexpected error occurred. Please try again.";
        if (error.message) {
          description = error.message;
        }
        setSignUpError(description);
    } finally {
      setIsSigningUp(false);
    }
  };
  
  const handleVerificationComplete = async () => {
    if (!pendingSignUpData) return;
    
    try {
      const { email, password, firstName, lastName, phone } = pendingSignUpData;
      const cleanPhone = phone.replace(/[\s+]/g, '');
      const displayName = `${firstName} ${lastName}`;
      
      await signUp(email, password, { displayName });
      
      // Send welcome email
      await fetch('/api/send-welcome-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName, lastName }),
      });
      
      setIsVerificationOpen(false);
      setPendingSignUpData(null);
      // The auth provider will handle the redirect
    } catch (error: any) {
        let description = "An unexpected error occurred. Please try again.";
        if (error instanceof FirebaseError) {
            if (error.code === 'auth/email-already-in-use') {
                description = "This email is already in use. Please sign in instead.";
            } else if (error.code === 'auth/invalid-email') {
                description = "Invalid email address.";
            } else if (error.code === 'auth/weak-password') {
                description = "Password is too weak. Please use a stronger password.";
            }
        }
        setSignUpError(description);
        setIsVerificationOpen(false);
        setIsSignUpOpen(true);
    }
  };
  
  const handleResendVerificationCode = async () => {
    if (!pendingSignUpData) return;
    
    await fetch('/api/send-verification-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: pendingSignUpData.email, 
        firstName: pendingSignUpData.firstName 
      }),
    });
  };
  
    // If the user is logged in, we render null while the useEffect redirects
    if (user || loading) {
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
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
        <CustomButton onClick={openWaitlist}>
          Join the waitlist
        </CustomButton>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="py-24 px-4 md:py-32 w-full">
          <Hero
            text={["Discover your", "creative universe"]}
            gradientStart="#A07FBD"
            gradientEnd="#23AF98"
          />
          
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
                  <p className="text-red-500 text-sm mt-2">
                    {error} <button type="button" className="text-primary hover:underline" onClick={openResetPassword}>Forgot password?</button>
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex-shrink-0">
            <div className="mb-4">
              <CustomButton onClick={handleSignIn} className="w-full">Sign In</CustomButton>
            </div>

            <div className="text-center text-sm text-muted-foreground mt-4">
              Want to create communities? <button type="button" className="text-primary hover:underline" onClick={openSignUp}>Sign Up</button>
            </div>
            <div className="text-center text-sm text-muted-foreground mt-2">
              Just browsing? <button type="button" className="text-primary hover:underline" onClick={openWaitlist}>Join the waitlist</button>
            </div>
          </div>
        </div>
      </CustomFormDialog>

      <CustomFormDialog 
        open={isSignUpOpen} 
        onOpenChange={setIsSignUpOpen}
        title="Create Your Account"
        description="Sign up to create and manage your own communities on Kyozo."
      >
        <div className="flex flex-col h-full">
            <div className="flex-grow space-y-4 overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                type="text"
                value={signUpFirstName}
                onChange={(e) => setSignUpFirstName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
              />
              <Input
                label="Last Name"
                type="text"
                value={signUpLastName}
                onChange={(e) => setSignUpLastName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
              />
            </div>
            <PhoneInput
              label="Phone Number"
              value={signUpPhone}
              onChange={(value) => setSignUpPhone(value)}
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
          </div>
          {signUpError && (
            <div className="text-sm text-red-500 bg-red-50 p-3 rounded">
              {signUpError}
            </div>
          )}
          
          <div className="mt-6 flex-shrink-0">
            <div className="mb-4">
              <CustomButton onClick={handleSignUp} className="w-full">Create Account</CustomButton>
            </div>

            <div className="text-center text-sm text-muted-foreground mt-4">
              Already have an account? <button type="button" className="text-primary hover:underline" onClick={openSignIn}>Sign In</button>
            </div>
            <div className="text-center text-sm text-muted-foreground mt-2">
              Just browsing? <button type="button" className="text-primary hover:underline" onClick={openWaitlist}>Join the waitlist</button>
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

      <EmailVerificationDialog
        open={isVerificationOpen}
        onOpenChange={setIsVerificationOpen}
        email={pendingSignUpData?.email || ''}
        firstName={pendingSignUpData?.firstName || ''}
        onVerified={handleVerificationComplete}
        onResend={handleResendVerificationCode}
      />
    </div>
  );
}
