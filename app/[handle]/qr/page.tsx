'use client';

/**
 * Owner-facing "show this QR" screen. Displays the community's join link as a
 * QR code so a person you just met can scan it with their phone camera and
 * land on the public signup form (/{handle}/join). Designed to be saved to
 * the home screen for one-tap access at events.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, ScanLine } from 'lucide-react';
import { db } from '@/firebase/firestore';
import { Community } from '@/lib/types';
import { RoundImage } from '@/components/ui/round-image';

export default function CommunityQrPage() {
  const params = useParams();
  const handle = params.handle as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [joinUrl, setJoinUrl] = useState('');

  useEffect(() => {
    // Built client-side so the QR points at whatever host serves this page
    // (mobile.kyozo.com in production, localhost in dev).
    setJoinUrl(`${window.location.origin}/${handle}/join?src=qr`);
  }, [handle]);

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, 'communities'), where('handle', '==', handle))
        );
        if (!snap.empty) {
          setCommunity({ communityId: snap.docs[0].id, ...snap.docs[0].data() } as Community);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCommunity();
  }, [handle]);

  if (loading) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div
      className="flex h-full min-h-[100dvh] md:min-h-screen flex-col items-center justify-center gap-6 p-6"
      style={{ backgroundColor: 'var(--page-bg-color)' }}
    >
      {community && (
        <div className="flex flex-col items-center gap-2">
          <RoundImage
            src={community.communityProfileImage || ''}
            alt={community.name}
            size={64}
            border={true}
          />
          <h1 className="text-2xl font-bold text-center" style={{ color: '#5B4A3A' }}>
            {community.name}
          </h1>
          {community.tagline && (
            <p className="text-sm text-center" style={{ color: '#8B7355' }}>
              {community.tagline}
            </p>
          )}
        </div>
      )}

      {joinUrl && (
        <div
          className="rounded-3xl bg-white p-6 shadow-lg"
          style={{ border: '2px solid var(--page-content-border)' }}
        >
          <QRCodeSVG value={joinUrl} size={256} level="M" marginSize={1} />
        </div>
      )}

      <div className="flex items-center gap-2 text-sm" style={{ color: '#8B7355' }}>
        <ScanLine className="h-4 w-4" />
        Scan with your phone camera to join
      </div>
    </div>
  );
}
