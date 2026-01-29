'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Community } from '@/lib/types';
import { Globe, Lock, Sparkles, BarChart3, Ticket, Lock as LockIcon, Plus } from 'lucide-react';
import { Banner } from '@/components/ui/banner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLoadingSkeleton } from '@/components/community/page-loading-skeleton';

interface PricingFeature {
  id: string;
  name: string;
  description: string;
  price: string;
  features: string[];
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

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

  const pricingFeatures: PricingFeature[] = [
    {
      id: 'analytics',
      name: 'Analytics',
      description: 'Deep insights into your community engagement, member behavior, and content performance',
      price: '$29',
      features: [
        'Member growth tracking',
        'Engagement metrics',
        'Content performance',
        'Revenue analytics',
        'Custom reports',
      ],
      icon: <BarChart3 className="h-6 w-6" />,
      iconBg: '#EEF4FF',
      iconColor: '#4B7BF5',
    },
    {
      id: 'ticketing',
      name: 'Ticketing',
      description: 'Sell tickets to events, manage sales, and track attendance with integrated payment processing',
      price: '$39',
      features: [
        'Event ticket sales',
        'Payment processing',
        'QR code check-in',
        'Tiered pricing',
        'Discount codes',
      ],
      icon: <Ticket className="h-6 w-6" />,
      iconBg: '#FFF3E8',
      iconColor: '#E07B39',
    },
  ];

  if (loading) {
    return <PageLoadingSkeleton showMemberList={true} />;
  }

  if (!community) {
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
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-6 w-6" style={{ color: '#E07B39' }} />
              <h2 className="text-2xl font-semibold" style={{ color: '#5B4A3A' }}>More Features</h2>
            </div>
            <p className="text-sm mb-8" style={{ color: '#8B7355' }}>Enhance your community platform with premium add-ons</p>
            
            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {pricingFeatures.map((feature) => (
                <Card key={feature.id} className="p-6 border-2" style={{ borderColor: '#E8DFD1' }}>
                  <div className="flex items-start gap-4 mb-4">
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: feature.iconBg, color: feature.iconColor }}
                    >
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-xl" style={{ color: '#5B4A3A' }}>{feature.name}</h3>
                      <span 
                        className="inline-block text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: '#FFF3E8', color: '#E07B39' }}
                      >
                        Add-on Feature
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm mb-4" style={{ color: '#8B7355' }}>{feature.description}</p>
                  
                  <div className="mb-4">
                    <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#5B4A3A' }}>WHAT'S INCLUDED:</p>
                    <ul className="space-y-1">
                      {feature.features.map((item, index) => (
                        <li key={index} className="text-sm flex items-center gap-2" style={{ color: '#8B7355' }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#8B7355' }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex items-center justify-between mt-6">
                    <div>
                      <span className="text-3xl font-bold" style={{ color: '#5B4A3A' }}>{feature.price}</span>
                      <span className="text-sm" style={{ color: '#8B7355' }}>/month</span>
                    </div>
                    <Button 
                      className="gap-2"
                      style={{ backgroundColor: '#E07B39', color: 'white' }}
                    >
                      <LockIcon className="h-4 w-4" />
                      Upgrade Now
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            
            {/* Custom Package Card */}
            <Card className="p-6 border-2" style={{ borderColor: '#E8DFD1' }}>
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#EEF4FF', color: '#4B7BF5' }}
                >
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold" style={{ color: '#5B4A3A' }}>Need a custom package?</h3>
                  <p className="text-sm" style={{ color: '#8B7355' }}>Contact our team to discuss enterprise features, custom integrations, or volume pricing for your creative community.</p>
                </div>
                <Button 
                  variant="outline"
                  style={{ borderColor: '#E07B39', color: '#E07B39' }}
                >
                  Contact Sales
                </Button>
              </div>
            </Card>
          </div>
        </div>
        
        {/* Floating Action Button */}
        <button
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#E07B39' }}
        >
          <Plus className="h-6 w-6 text-white" />
        </button>
      </div>
    </div>
  );
}
