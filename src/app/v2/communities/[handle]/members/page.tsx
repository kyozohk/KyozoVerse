'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Community, CommunityMember } from '@/lib/types';
import { Loader2, UserPlus, Mail } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/v2/page-header';
import { CustomListView } from '@/components/v2/custom-list-view';
import { MemberListItem } from '@/components/members/member-list-item';
import { MemberGridItem } from '@/components/members/member-grid-item';

export default function MembersPage() {
  const params = useParams();
  const handle = params.handle as string;
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');

  useEffect(() => {
    const fetchCommunityAndMembers = async () => {
      try {
        const communityQuery = query(collection(db, 'communities'), where('handle', '==', handle));
        const communitySnapshot = await getDocs(communityQuery);
        
        if (!communitySnapshot.empty) {
          const communityData = { communityId: communitySnapshot.docs[0].id, ...communitySnapshot.docs[0].data() } as Community;
          setCommunity(communityData);

          const membersQuery = query(collection(db, 'communityMembers'), where('communityId', '==', communityData.communityId));
          const membersSnapshot = await getDocs(membersQuery);
          const membersData = membersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as CommunityMember);
          setMembers(membersData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCommunityAndMembers();
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
      <div className="p-8 flex-1 overflow-auto flex flex-col">
        <div className="rounded-2xl flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--page-content-bg)', border: '2px solid var(--page-content-border)' }}>
          {/* Community Header */}
          <div style={{ backgroundColor: 'var(--page-content-bg)' }}>
            {community.communityBackgroundImage && (
              <div className="relative h-32">
                <Image src={community.communityBackgroundImage} alt={community.name} fill className="object-cover" />
              </div>
            )}
            <div className="p-6 border-b">
              <div className="flex items-start gap-4">
                {community.communityProfileImage && (
                  <Image src={community.communityProfileImage} alt={community.name} width={80} height={80} className="rounded-full" />
                )}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold">{community.name}</h1>
                  <p className="text-sm text-muted-foreground mt-1">{community.tagline}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Members Header with CTAs */}
          <PageHeader
            title="Members"
            description="Manage your community members"
            actions={
              <>
                <Button variant="outline">
                  <Mail className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              </>
            }
          />

          {/* Members Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <CustomListView
              items={members}
              renderListItem={(member) => <MemberListItem key={member.id} member={member} />}
              renderGridItem={(member) => <MemberGridItem key={member.id} member={member} />}
              viewMode={viewMode}
              setViewMode={setViewMode}
              itemClassName={{ list: 'mb-4', grid: '' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
