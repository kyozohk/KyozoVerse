'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Community } from '@/lib/types';
import { Globe, Lock, PlusCircle, Users, Calendar, MapPin } from 'lucide-react';
import { Banner } from '@/components/ui/banner';
import { Card } from '@/components/ui/card';
import { PageLoadingSkeleton } from '@/components/community/page-loading-skeleton';
import { CreateGuestlistDialog } from '@/components/guestlist/create-guestlist-dialog';
import { EnhancedListView } from '@/components/v2/enhanced-list-view';

interface MemberData {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  imageUrl: string;
  role?: string;
  joinedDate?: any;
  tags?: string[];
}

interface GuestlistMember {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  imageUrl?: string;
  tags?: string[];
}

interface Guestlist {
  id: string;
  name: string;
  eventName?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  description?: string;
  memberCount: number;
  members: GuestlistMember[];
  createdAt: any;
  tags?: string[]; // Accumulated tags from members
}

export default function GuestlistPage() {
  const params = useParams();
  const handle = params.handle as string;
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [guestlists, setGuestlists] = useState<Guestlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch community and members
  useEffect(() => {
    const fetchCommunityAndMembers = async () => {
      try {
        const communitiesRef = collection(db, 'communities');
        const q = query(communitiesRef, where('handle', '==', handle));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const communityData = { communityId: doc.id, ...doc.data() } as Community;
          setCommunity(communityData);

          // Fetch community members
          const membersQuery = query(
            collection(db, 'communityMembers'),
            where('communityId', '==', communityData.communityId)
          );
          const membersSnapshot = await getDocs(membersQuery);
          
          const membersData: MemberData[] = membersSnapshot.docs.map(memberDoc => {
            const data = memberDoc.data();
            const userDetails = data.userDetails || {};
            return {
              id: memberDoc.id,
              userId: data.userId || memberDoc.id,
              name: userDetails.displayName || userDetails.name || data.displayName || 'Unknown',
              email: userDetails.email || data.email,
              phone: userDetails.phone || userDetails.phoneNumber || data.phone,
              imageUrl: userDetails.photoURL || userDetails.avatarUrl || data.avatarUrl || '/default-avatar.png',
              role: data.role,
              joinedDate: data.joinedAt,
              tags: data.tags || [],
            };
          });
          setMembers(membersData);
        }
      } catch (error) {
        console.error('Error fetching community:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityAndMembers();
  }, [handle]);

  // Subscribe to guestlists
  useEffect(() => {
    if (!community?.communityId) return;

    const guestlistsQuery = query(
      collection(db, 'guestlists'),
      where('communityId', '==', community.communityId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(guestlistsQuery, (snapshot) => {
      const guestlistsData: Guestlist[] = snapshot.docs.map(doc => {
        const data = doc.data();
        // Accumulate tags from all members in the guestlist
        const memberTags = new Set<string>();
        if (data.members && Array.isArray(data.members)) {
          data.members.forEach((member: GuestlistMember) => {
            if (member.tags && Array.isArray(member.tags)) {
              member.tags.forEach(tag => memberTags.add(tag));
            }
          });
        }
        return {
          id: doc.id,
          ...data,
          tags: Array.from(memberTags),
        } as Guestlist;
      });
      setGuestlists(guestlistsData);
    });

    return () => unsubscribe();
  }, [community?.communityId]);

  const handleGuestlistCreated = (guestlist: any) => {
    // Guestlist will be added via the onSnapshot listener
    console.log('Guestlist created:', guestlist);
  };

  // Render functions for EnhancedListView
  const renderGuestlistGridItem = (guestlist: Guestlist) => (
    <Card className="h-48 p-4 cursor-pointer hover:shadow-md transition-shadow">
      <div className="flex flex-col h-full">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg truncate" style={{ color: '#5B4A3A' }}>
            {guestlist.name}
          </h3>
        </div>
        
        {guestlist.eventName && (
          <p className="text-sm truncate mb-1" style={{ color: '#8B7355' }}>
            {guestlist.eventName}
          </p>
        )}
        
        <div className="flex-1" />
        
        <div className="space-y-1">
          {guestlist.eventDate && (
            <div className="flex items-center gap-1 text-xs" style={{ color: '#8B7355' }}>
              <Calendar className="h-3 w-3" />
              <span>{new Date(guestlist.eventDate).toLocaleDateString()}</span>
              {guestlist.eventTime && <span>at {guestlist.eventTime}</span>}
            </div>
          )}
          {guestlist.eventLocation && (
            <div className="flex items-center gap-1 text-xs truncate" style={{ color: '#8B7355' }}>
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{guestlist.eventLocation}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1 mt-3 pt-3 border-t" style={{ borderColor: '#E8DFD1' }}>
          <Users className="h-4 w-4" style={{ color: '#E07B39' }} />
          <span className="text-sm font-medium" style={{ color: '#5B4A3A' }}>
            {guestlist.memberCount} Guest{guestlist.memberCount === 1 ? '' : 's'}
          </span>
        </div>
      </div>
    </Card>
  );

  const renderGuestlistListItem = (guestlist: Guestlist) => (
    <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg truncate" style={{ color: '#5B4A3A' }}>
              {guestlist.name}
            </h3>
            {guestlist.eventName && (
              <span className="text-sm truncate" style={{ color: '#8B7355' }}>
                - {guestlist.eventName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1">
            {guestlist.eventDate && (
              <div className="flex items-center gap-1 text-xs" style={{ color: '#8B7355' }}>
                <Calendar className="h-3 w-3" />
                <span>{new Date(guestlist.eventDate).toLocaleDateString()}</span>
                {guestlist.eventTime && <span>at {guestlist.eventTime}</span>}
              </div>
            )}
            {guestlist.eventLocation && (
              <div className="flex items-center gap-1 text-xs truncate" style={{ color: '#8B7355' }}>
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{guestlist.eventLocation}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1" style={{ color: '#5B4A3A' }}>
          <Users className="h-4 w-4" style={{ color: '#E07B39' }} />
          <span className="text-sm font-medium">
            {guestlist.memberCount} Guest{guestlist.memberCount === 1 ? '' : 's'}
          </span>
        </div>
      </div>
    </Card>
  );

  const renderGuestlistCircleItem = (guestlist: Guestlist) => (
    <div className="flex flex-col items-center gap-2 p-4 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors">
      <div 
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ backgroundColor: '#E07B39' }}
      >
        <Users className="h-8 w-8 text-white" />
      </div>
      <div className="text-center">
        <h3 className="font-medium text-sm truncate max-w-[120px]" style={{ color: '#5B4A3A' }}>
          {guestlist.name}
        </h3>
        <span className="text-xs" style={{ color: '#8B7355' }}>
          {guestlist.memberCount} Guest{guestlist.memberCount === 1 ? '' : 's'}
        </span>
      </div>
    </div>
  );

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
              ctas={[{
                label: 'Create Guestlist',
                icon: <PlusCircle className="h-4 w-4" />,
                onClick: () => setIsCreateDialogOpen(true),
              }]}
              height="16rem"
            />
          )}
          <div className="mb-4 px-6 pt-6">
            <h2 className="text-xl font-semibold" style={{ color: '#5B4A3A' }}>RSVP & Guestlist</h2>
            <p className="text-sm" style={{ color: '#8B7355' }}>Manage event RSVPs and guest lists</p>
          </div>
          
          <EnhancedListView
            items={guestlists}
            renderGridItem={renderGuestlistGridItem}
            renderListItem={renderGuestlistListItem}
            renderCircleItem={renderGuestlistCircleItem}
            searchKeys={['name', 'eventName', 'eventLocation', 'description']}
            selectable={false}
            isLoading={loading}
            defaultViewMode="grid"
          />
        </div>
      </div>

      {/* Create Guestlist Dialog */}
      <CreateGuestlistDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        members={members}
        communityId={community.communityId}
        communityName={community.name}
        onGuestlistCreated={handleGuestlistCreated}
      />
    </div>
  );
}
