'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Community } from '@/lib/types';
import { Loader2, Edit } from 'lucide-react';
import { CommunityImage } from '@/components/ui/community-image';
import { RoundImage } from '@/components/ui/round-image';
import { CreateCommunityDialog } from '@/components/community/create-community-dialog';
import { Button } from '@/components/ui/button';

export default function CommunityPage() {
  const params = useParams();
  const handle = params.handle as string;
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const communityQuery = query(collection(db, 'communities'), where('handle', '==', handle));
        const snapshot = await getDocs(communityQuery);
        if (!snapshot.empty) {
          setCommunity({ communityId: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Community);
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
          {community.communityBackgroundImage && (
            <CommunityImage 
              src={community.communityBackgroundImage} 
              alt={community.name} 
              fill 
              containerClassName="relative h-48"
              className="object-cover" 
            />
          )}
          <div className="p-8">
            <div className="flex items-start gap-6">
              {community.communityProfileImage && (
                <RoundImage 
                  src={community.communityProfileImage} 
                  alt={community.name} 
                  size={120}
                  border={true}
                />
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold tracking-tight">{community.name}</h1>
                {community.tagline && (
                  <p className="text-muted-foreground mt-2">{community.tagline}</p>
                )}
                {(community as any).location && (
                  <p className="text-sm text-muted-foreground mt-1">📍 {(community as any).location}</p>
                )}
                {(community as any).mantras && (
                  <p className="text-sm mt-3 whitespace-pre-wrap">{(community as any).mantras}</p>
                )}
                {Array.isArray((community as any).tags) && (community as any).tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {(community as any).tags.map((tag: string) => (
                      <span key={tag} className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-sm font-semibold">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      <CreateCommunityDialog 
        isOpen={isEditDialogOpen} 
        setIsOpen={setIsEditDialogOpen}
        existingCommunity={community}
      />
    </div>
  );
}
