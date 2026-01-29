'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Community } from '@/lib/types';
import { Globe, Lock, Plus, Sparkles, Zap, Star } from 'lucide-react';
import { Banner } from '@/components/ui/banner';
import { Card } from '@/components/ui/card';

export default function MoreFeaturesPage() {
  const params = useParams();
  const handle = params.handle as string;
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const communitiesRef = collection(db, 'communities');
        const q = query(communitiesRef, where('handle', '==', handle));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          setCommunity({ communityId: doc.id, ...doc.data() } as Community);
        }
      } catch (error) {
        console.error('Error fetching community:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunity();
  }, [handle]);

  if (!community && !loading) {
    return (
      <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--page-bg-color)' }}>
        <div className="p-8">
          <div className="rounded-2xl p-8" style={{ backgroundColor: 'var(--page-content-bg)', border: '2px solid var(--page-content-border)' }}>
            <p>Community not found</p>
          </div>
        </div>
      </div>
    );
  }

  const features = [
    { icon: Sparkles, title: 'AI Assistant', description: 'Coming soon', disabled: true },
    { icon: Zap, title: 'Automations', description: 'Coming soon', disabled: true },
    { icon: Star, title: 'Premium Features', description: 'Coming soon', disabled: true },
  ];

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--page-bg-color)' }}>
      <div className="p-8 flex-1 overflow-auto">
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--page-content-bg)', border: '2px solid var(--page-content-border)' }}>
          {community && (
            <Banner
              backgroundImage={community.communityBackgroundImage}
              iconImage={community.communityProfileImage}
              title={community.name}
              location={(community as any).location}
              locationExtra={
                <span className="flex items-center gap-1 text-sm text-white/90">
                  {(community as any).visibility === 'private' ? (
                    <><Lock className="h-3.5 w-3.5" /> Private</>
                  ) : (
                    <><Globe className="h-3.5 w-3.5" /> Public</>
                  )}
                </span>
              }
              subtitle={community.tagline || (community as any).mantras}
              tags={(community as any).tags || []}
              height="16rem"
            />
          )}
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold" style={{ color: '#5B4A3A' }}>More Features</h2>
                <p className="text-sm" style={{ color: '#8B7355' }}>Explore additional features for your community</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {features.map((feature, index) => (
                <Card key={index} className="flex flex-col items-center justify-center h-48 cursor-pointer hover:bg-primary/5 transition-colors opacity-60">
                  <div className="text-center" style={{ color: '#8B7355' }}>
                    <feature.icon className="mx-auto h-10 w-10 mb-2" />
                    <span className="font-medium block">{feature.title}</span>
                    <span className="text-xs">{feature.description}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
