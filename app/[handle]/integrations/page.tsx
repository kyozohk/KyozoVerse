'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Community } from '@/lib/types';
import { Globe, Lock, ExternalLink, Calendar, Music, Instagram, Mail, UtensilsCrossed } from 'lucide-react';
import { Banner } from '@/components/ui/banner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Integration {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

export default function IntegrationsPage() {
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

  const integrations: Integration[] = [
    {
      id: 'eventbrite',
      name: 'Eventbrite',
      category: 'Events & Ticketing',
      description: 'Import event attendees and ticket sales data from your Eventbrite events.',
      icon: <Calendar className="h-6 w-6" />,
      iconBg: '#FFF3E8',
      iconColor: '#E07B39',
    },
    {
      id: 'resident-advisor',
      name: 'Resident Advisor',
      category: 'Events & Ticketing',
      description: 'Sync your RA events and connect with attendees from the electronic music community.',
      icon: <Music className="h-6 w-6" />,
      iconBg: '#EEF4FF',
      iconColor: '#4B7BF5',
    },
    {
      id: 'instagram',
      name: 'Instagram',
      category: 'Social Media',
      description: 'Connect your Instagram account to import followers and engage with your community.',
      icon: <Instagram className="h-6 w-6" />,
      iconBg: '#FEF2F2',
      iconColor: '#E1306C',
    },
    {
      id: 'gmail',
      name: 'Gmail',
      category: 'Communication',
      description: 'Sync contacts from Gmail and send emails directly from your Kyozo community.',
      icon: <Mail className="h-6 w-6" />,
      iconBg: '#FEF2F2',
      iconColor: '#C5221F',
    },
    {
      id: 'sevenrooms',
      name: 'SevenRooms',
      category: 'Hospitality',
      description: 'Import reservations and guest data from your SevenRooms hospitality platform.',
      icon: <UtensilsCrossed className="h-6 w-6" />,
      iconBg: '#F5F3FF',
      iconColor: '#7C3AED',
    },
  ];

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
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-1" style={{ color: '#5B4A3A' }}>Integrations</h2>
              <p className="text-sm" style={{ color: '#8B7355' }}>Connect your favorite platforms to grow and manage your community.</p>
            </div>
            
            <h3 className="text-lg font-medium mb-4" style={{ color: '#5B4A3A' }}>All Integrations</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {integrations.map((integration) => (
                <Card key={integration.id} className="p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: integration.iconBg, color: integration.iconColor }}
                    >
                      {integration.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg" style={{ color: '#5B4A3A' }}>{integration.name}</h4>
                      <span 
                        className="inline-block text-xs px-2 py-0.5 rounded-full mb-2"
                        style={{ backgroundColor: '#F5F0EB', color: '#8B7355' }}
                      >
                        {integration.category}
                      </span>
                      <p className="text-sm mb-4" style={{ color: '#8B7355' }}>{integration.description}</p>
                      <Button 
                        size="sm" 
                        className="gap-1"
                        style={{ backgroundColor: '#E07B39', color: 'white' }}
                      >
                        Connect <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </div>
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
