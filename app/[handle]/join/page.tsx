'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Community } from '@/lib/types';
import { Loader2, Eye, EyeOff, CheckCircle, BookUser } from 'lucide-react';
import { Input, CustomButton, PasswordInput } from '@/components/ui';
import Image from 'next/image';
import { PrivacyPolicyDialog } from '@/components/auth/privacy-policy-dialog';

// First-party "remember me" for the join form: after a successful join on
// this device, we keep the visitor's details so scanning any community QR
// later prefills the whole form.
const JOIN_PROFILE_KEY = 'kyozo:join-profile';

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
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);
  const [contactPickerSupported, setContactPickerSupported] = useState(false);

  // Auto-prefill: URL params win (already in state); otherwise restore the
  // profile remembered from a previous join on this device.
  useEffect(() => {
    setContactPickerSupported(
      typeof navigator !== 'undefined' && 'contacts' in navigator && 'select' in (navigator as any).contacts
    );
    try {
      const saved = localStorage.getItem(JOIN_PROFILE_KEY);
      if (!saved) return;
      const profile = JSON.parse(saved);
      setFirstName(prev => prev || profile.firstName || '');
      setLastName(prev => prev || profile.lastName || '');
      setEmail(prev => prev || profile.email || '');
      setPhone(prev => prev || profile.phone || '');
    } catch {
      // Corrupt/blocked storage — manual entry still works.
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Android Chrome: let the visitor pick their own contact card and fill
  // everything at once. (iOS fills via the keyboard's AutoFill Contact.)
  const handleFillFromContacts = async () => {
    try {
      const contacts = await (navigator as any).contacts.select(
        ['name', 'email', 'tel'],
        { multiple: false }
      );
      const c = contacts?.[0];
      if (!c) return;
      const fullName: string = (c.name?.[0] || '').trim();
      if (fullName) {
        const [first, ...rest] = fullName.split(/\s+/);
        setFirstName(first);
        setLastName(rest.join(' '));
      }
      if (c.email?.[0]) setEmail(c.email[0]);
      if (c.tel?.[0]) setPhone(c.tel[0]);
    } catch {
      // Picker dismissed/unavailable — manual entry still works.
    }
  };

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
    if (!privacyAccepted) {
      setError('Please agree to the Privacy Policy to join');
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

      // Remember the visitor's details on this device so the next community
      // QR they scan prefills the form.
      try {
        localStorage.setItem(
          JOIN_PROFILE_KEY,
          JSON.stringify({ firstName, lastName, email, phone })
        );
      } catch {
        // Storage blocked — not critical.
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
          <p className="mb-4" style={{ color: '#8B7355' }}>Your account has been created and you've joined the community.</p>
          <p className="text-sm" style={{ color: '#8B7355' }}>Redirecting you to the community...</p>
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
        <div className={`bg-white rounded-2xl shadow-xl mx-4 ${bannerImage ? 'mt-4 pt-14' : 'mt-8 pt-8'} pb-8 px-6`}>
          {/* Community branding — the person is joining this community */}
          <div className="text-center mb-6">
            {!bannerImage && logoImage && (
              <div className="mx-auto mb-4 relative w-20 h-20 rounded-full overflow-hidden border-4 shadow-md" style={{ borderColor: '#E8DFD1' }}>
                <Image src={logoImage} alt={community.name} fill className="object-cover" />
              </div>
            )}
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#8B7355' }}>
              You're invited to join the community
            </p>
            <h1 className="text-3xl font-bold mt-1" style={{ color: '#5B4A3A' }}>{community.name}</h1>
            {community.tagline && (
              <p className="text-sm mt-2" style={{ color: '#8B7355' }}>{community.tagline}</p>
            )}
            {community.memberCount > 0 && (
              <p className="text-xs mt-2" style={{ color: '#8B7355' }}>
                {community.memberCount.toLocaleString()} {community.memberCount === 1 ? 'member' : 'members'}
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {contactPickerSupported && (
              <button
                type="button"
                onClick={handleFillFromContacts}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-lg border border-dashed text-sm font-semibold transition-colors hover:bg-[#FAF5EC]"
                style={{ borderColor: '#E07B39', color: '#E07B39' }}
              >
                <BookUser className="h-4 w-4" />
                Fill with my contact info
              </button>
            )}
            {/* autocomplete attributes let iOS/Android fill the visitor's own
                contact details with one tap (AutoFill Contact / saved info) —
                a website cannot read these silently. */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                type="text"
                name="given-name"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                label="Last Name"
                type="text"
                name="family-name"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Phone Number (optional)"
              type="tel"
              name="tel"
              autoComplete="tel"
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
            {/* Privacy policy consent */}
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                className="mt-0.5 h-5 w-5 rounded accent-[#5B4A3A] cursor-pointer"
              />
              <span className="text-sm" style={{ color: '#5B4A3A' }}>
                I agree to the{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setPrivacyDialogOpen(true);
                  }}
                  className="underline font-semibold"
                  style={{ color: '#5B4A3A' }}
                >
                  Privacy Policy
                </button>
              </span>
            </label>

             <CustomButton
              type="submit"
              disabled={submitting || !privacyAccepted}
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
      <PrivacyPolicyDialog open={privacyDialogOpen} onOpenChange={setPrivacyDialogOpen} />
    </div>
  );
}
