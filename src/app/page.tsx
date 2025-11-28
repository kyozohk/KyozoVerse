// import { LandingPage } from '@/components/landing/landing-page';

// export default function Home() {
//   return <LandingPage />;
// }

// import React from 'react';
// import { Hero } from '@/components/landing/hero';

// export default function LandingPage() {
//   return (
//     <main className="py-24 px-4 md:py-32" style={{ backgroundColor: 'rgba(0, 0, 0, 0.08)' }}>
//       <Hero />
//       {/* Add more landing page sections here */}
//     </main>
//   );
// }


'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase/auth';

export default function WillerBirthdayBash() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Auto-login with dev account on mount
  useEffect(() => {
    const autoLogin = async () => {
      try {
        await signInWithEmailAndPassword(auth, 'dev@kyozo.com', '123123123');
        setIsAuthReady(true);
      } catch (error) {
        console.error('Auto-login failed:', error);
        setIsAuthReady(true); // Continue anyway
      }
    };
    autoLogin();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Find the community by handle
      const communitiesRef = collection(db, 'communities');
      const q = query(communitiesRef, where('handle', '==', 'willers-birthday-bash'));
      const communitySnapshot = await getDocs(q);

      if (communitySnapshot.empty) {
        throw new Error('Community not found');
      }

      const communityDoc = communitySnapshot.docs[0];
      const communityId = communityDoc.id;

      // Create a new user document
      const usersRef = collection(db, 'users');
      const newUserRef = await addDoc(usersRef, {
        displayName: `${formData.firstName} ${formData.lastName}`,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        phoneNumber: formData.phone,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Add as community member
      const memberRef = collection(db, 'communityMembers');
      await addDoc(memberRef, {
        userId: newUserRef.id,
        communityId: communityId,
        role: 'member',
        status: 'active',
        joinedAt: serverTimestamp(),
        userDetails: {
          displayName: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          avatarUrl: '',
        },
        messageToWill: formData.message,
      });

      // Update community member count
      const communityDocRef = doc(db, 'communities', communityId);
      await updateDoc(communityDocRef, {
        memberCount: increment(1),
      });

      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting RSVP:', error);
      alert('Failed to submit RSVP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (isSubmitted) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          backgroundImage: 'url(/willer-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-black/10" />
        <Card className="relative z-10 w-full max-w-md bg-black/20 border-white/20 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Thank You! 🎉</h2>
            <p className="text-white/90 text-lg mb-2">
              We can't wait to see you at the party!
            </p>
            <p className="text-white/70 text-sm">
              Yume at On Lok House<br />
              39-43 Hollywood Rd<br />
              9:30 PM
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-black"
      style={{
        backgroundImage: 'url(/willer-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
            Join Willer Birthday Bash
          </h1>
          <div className="text-white/90 text-lg space-y-1">
            <p className="font-semibold">Yume at On Lok House</p>
            <p>39-43 Hollywood Rd</p>
            <p className="text-xl font-bold text-white">9:30 PM</p>
          </div>
        </div>

        {/* Form */}
        <Card className="bg-black/60 border-white/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="bg-white/80 border-white/20 text-white placeholder:text-white/80"
                    style={{ color: 'white' }}
                  />
                </div>
                <div>
                  <Input
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    style={{ color: 'white' }}
                  />
                </div>
              </div>

              <div>
                <Input
                  name="email"
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  style={{ color: 'white' }}
                />
              </div>

              <div>
                <Input
                  name="phone"
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  style={{ color: 'white' }}
                />
              </div>

              <div>
                <Textarea
                  name="message"
                  placeholder="Message to Will"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 resize-none"
                  style={{ color: 'white' }}
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-white text-black hover:bg-white/90 font-semibold text-lg py-6"
              >
                {isSubmitting ? 'Submitting...' : 'RSVP Now'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
