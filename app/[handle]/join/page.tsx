'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { collection, query, where, getDocs, addDoc, setDoc, doc, serverTimestamp, increment, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { communityAuth } from '@/firebase/community-auth';
import { Community } from '@/lib/types';
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Input, CustomButton } from '@/components/ui';
import Image from 'next/image';

export default function JoinCommunityPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const handle = params.handle as string;

  // Form state from URL params
  const [firstName, setFirstName] = useState(searchParams.get('firstName') || '');
  const [lastName, setLastName] = useState(searchParams.get('lastName') || '');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [phone, setPhone] = useState(searchParams.get('phone') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Fetch community data
  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const communityQuery = query(collection(db, 'communities'), where('handle', '==', handle));
        const snapshot = await getDocs(communityQuery);
        if (!snapshot.empty) {
          const communityData = { communityId: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Community;
          setCommunity(communityData);
        }
      } catch (error) {
        console.error('Error fetching community:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCommunity();
  }, [handle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!firstName || !lastName) {
      setError('Please enter your first and last name');
      return;
    }
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!community?.communityId) {
      setError('Community not found');
      return;
    }

    setSubmitting(true);

    try {
      // Check if user already exists
      const usersRef = collection(db, 'users');
      const emailQuery = query(usersRef, where('email', '==', email));
      const emailSnap = await getDocs(emailQuery);

      if (!emailSnap.empty) {
        setError('An account with this email already exists. Please sign in instead.');
        setSubmitting(false);
        return;
      }

      // Normalize phone number
      let normalizedPhone = phone ? phone.trim().replace(/\s+/g, '') : '';
      if (normalizedPhone && !normalizedPhone.startsWith('+')) {
        normalizedPhone = '+' + normalizedPhone;
      }
      const wa_id = normalizedPhone ? normalizedPhone.replace(/\+/g, '').replace(/\s+/g, '') : '';

      // Create Firebase user account
      const userCredential = await createUserWithEmailAndPassword(communityAuth, email, password);
      const userId = userCredential.user.uid;

      const displayName = `${firstName} ${lastName}`.trim();

      // Create user document
      await setDoc(doc(db, 'users', userId), {
        userId,
        displayName,
        firstName,
        lastName,
        email,
        phone: normalizedPhone || null,
        phoneNumber: normalizedPhone || null,
        wa_id: wa_id || null,
        createdAt: serverTimestamp(),
      });

      // Add user as community member
      await addDoc(collection(db, 'communityMembers'), {
        userId,
        communityId: community.communityId,
        role: 'member',
        status: 'active',
        joinedAt: serverTimestamp(),
        userDetails: {
          displayName,
          email,
          avatarUrl: null,
          phone: normalizedPhone || null,
        },
      });

      // Increment member count
      await updateDoc(doc(db, 'communities', community.communityId), {
        memberCount: increment(1),
      });

      setSuccess(true);

      // Redirect to community page after 2 seconds
      setTimeout(() => {
        router.push(`/${handle}`);
      }, 2000);

    } catch (error: any) {
      console.error('Error creating account:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please sign in instead.');
      } else {
        setError(error.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F0E8' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#5B4A3A' }} />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F0E8' }}>
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#5B4A3A' }}>Community Not Found</h1>
          <p style={{ color: '#8B7355' }}>The community you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const primaryColor = (community as any).primaryColor || '#843484';
  const bannerImage = community.communityBackgroundImage;
  const logoImage = community.communityProfileImage;

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F0E8' }}>
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
          <CheckCircle className="h-16 w-16 mx-auto mb-4" style={{ color: '#22c55e' }} />
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#5B4A3A' }}>Welcome to {community.name}!</h1>
          <p className="mb-4" style={{ color: '#8B7355' }}>Your account has been created and you've joined the community.</p>
          <p className="text-sm" style={{ color: '#8B7355' }}>Redirecting you to the community...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>
      <div className="max-w-lg mx-auto">
        {/* Community Banner */}
        {bannerImage && (
          <div className="relative h-48 w-full">
            <Image
              src={bannerImage}
              alt={community.name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60" />
            {logoImage && (
              <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  <Image
                    src={logoImage}
                    alt={community.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Form Card */}
        <div className={`bg-white rounded-2xl shadow-xl mx-4 ${bannerImage ? '-mt-4 pt-14' : 'mt-8'} pb-8 px-6`}>
          {/* Community Info */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold" style={{ color: '#5B4A3A' }}>{community.name}</h1>
            {community.tagline && (
              <p className="text-sm mt-1" style={{ color: '#8B7355' }}>{community.tagline}</p>
            )}
            <p className="text-sm mt-3" style={{ color: '#5B4A3A' }}>
              You've been invited to join this community!
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              required
            />

            <Input
              label="Phone Number (optional)"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1234567890"
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <CustomButton
              type="submit"
              disabled={submitting}
              className="w-full"
              style={{ backgroundColor: primaryColor }}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating Account...
                </>
              ) : (
                `Join ${community.name}`
              )}
            </CustomButton>
          </form>

          <p className="text-center text-xs mt-4" style={{ color: '#8B7355' }}>
            By joining, you agree to the community guidelines.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-xs" style={{ color: '#8B7355' }}>Powered by KyozoVerse</p>
        </div>
      </div>
    </div>
  );
}
