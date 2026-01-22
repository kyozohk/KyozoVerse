'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Community } from '@/lib/types';
import { Loader2, Edit } from 'lucide-react';
import { CommunityImage } from '@/components/ui/community-image';
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
          const communityDoc = snapshot.docs[0];
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
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!community) {
    return <div className="p-8">Community not found</div>;
  }

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--page-bg-color)' }}>
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
                <div className="relative">
                  <CommunityImage 
                    src={community.communityProfileImage} 
                    alt={community.name} 
                    fill
                    sizes="120px"
                    containerClassName="rounded-full"
                    containerStyle={{ width: '120px', height: '120px' }}
                  />
                </div>
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
        <CreateCommunityDialog 
          isOpen={isEditDialogOpen} 
          setIsOpen={setIsEditDialogOpen}
          existingCommunity={community}
        />
      </div>
    </div>
  );
}
