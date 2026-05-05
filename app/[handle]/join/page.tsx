'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Community } from '@/lib/types';
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Input, CustomButton, PasswordInput } from '@/components/ui';
import Image from 'next/image';

export default function JoinCommunityPage() {
  const params = useParams();
  const searchParams = useSearchParams();
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
      // Use server-side API route (Admin SDK) to create user + membership.
      // This avoids all client-side auth state issues — community members are NOT
      // platform users and would be immediately signed out by AuthProvider.
      const res = await fetch('/api/join-community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          phone,
          communityId: community.communityId,
          communityHandle: handle,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create account. Please try again.');
        return;
      }

      setSuccess(true);
    } catch (error: any) {
      console.error('Error creating account:', error);
      setError(error.message || 'Failed to create account. Please try again.');
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
          <p className="mb-6" style={{ color: '#8B7355' }}>Your account has been created and you've joined the community. You'll receive updates and messages from the community team.</p>
          <CustomButton
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            Go to Community
          </CustomButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-12 px-4" style={{ backgroundColor: '#F5F0E8' }}>
      <div className="w-full max-w-lg">
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
        <div className={`bg-white rounded-2xl shadow-xl mx-4 ${bannerImage ? 'mt-4 pt-14' : 'mt-8'} pb-8 px-6`}>
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
                required
              />
              <Input
                label="Last Name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Phone Number (optional)"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <div className="relative">
              <PasswordInput 
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />             
            </div>

            <div className="relative">
              <PasswordInput
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />             
            </div>
             <CustomButton
              type="submit"
              disabled={submitting}
                        className="w-full flex-1"
                        style={{ backgroundColor: '#E8DFD1', color: '#5B4A3A', border: 'none' }}
                        
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
