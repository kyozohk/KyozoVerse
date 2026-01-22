'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Community } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function CommunityPage() {
  const params = useParams();
  const handle = params.handle as string;
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const communityDoc = await getDoc(doc(db, 'communities', handle));
        if (communityDoc.exists()) {
          setCommunity({ communityId: communityDoc.id, ...communityDoc.data() } as Community);
        }
      } catch (error) {
        console.error('Error fetching community:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCommunity();
  }, [handle]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!community) {
    return <div className="p-8">Community not found</div>;
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--page-bg-color)' }}>
      <div className="p-8 flex-1 overflow-auto">
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--page-content-bg)', border: '2px solid var(--page-content-border)' }}>
          {community.communityBackgroundImage && (
            <div className="relative h-48">
              <Image src={community.communityBackgroundImage} alt={community.name} fill className="object-cover" />
            </div>
          )}
          <div className="p-8">
            <div className="flex items-start gap-6">
              {community.communityProfileImage && (
                <Image src={community.communityProfileImage} alt={community.name} width={120} height={120} className="rounded-full" />
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold">{community.name}</h1>
                <p className="text-muted-foreground mt-2">{community.tagline}</p>
                {Array.isArray(community.mantras) && community.mantras.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {community.mantras.map((tag: string) => (
                      <span key={tag} className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-sm font-semibold">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
