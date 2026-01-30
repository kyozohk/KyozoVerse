'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Community } from '@/lib/types';
import { Globe, Lock, PlusCircle } from 'lucide-react';
import { Banner } from '@/components/ui/banner';
import { PageLoadingSkeleton } from '@/components/community/page-loading-skeleton';
import { CreateEventDialog } from '@/components/schedule/create-event-dialog';
import { EventCalendarView, CalendarEvent } from '@/components/schedule/event-calendar-view';

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

export default function SchedulePage() {
  const params = useParams();
  const handle = params.handle as string;
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

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

  // Subscribe to guestlists (events) - only those with eventDate
  useEffect(() => {
    if (!community?.communityId) return;

    const eventsQuery = query(
      collection(db, 'guestlists'),
      where('communityId', '==', community.communityId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const eventsData: CalendarEvent[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as CalendarEvent));
      setEvents(eventsData);
    });

    return () => unsubscribe();
  }, [community?.communityId]);

  const handleEventCreated = (event: any) => {
    console.log('Event created:', event);
  };

  const handleEventClick = (event: CalendarEvent) => {
    console.log('Event clicked:', event);
    setSelectedEvent(event);
    // TODO: Open event details dialog
  };

  const handleDayClick = (date: Date, dayEvents: CalendarEvent[]) => {
    // Format date as YYYY-MM-DD for the input
    const formattedDate = date.toISOString().split('T')[0];
    
    if (dayEvents.length === 0) {
      // No events on this day - open create dialog with this date
      setSelectedDate(formattedDate);
      setIsCreateDialogOpen(true);
    } else if (dayEvents.length === 1) {
      // Single event - open that event
      handleEventClick(dayEvents[0]);
    } else {
      // Multiple events - for now, open create dialog (could show a picker later)
      setSelectedDate(formattedDate);
      setIsCreateDialogOpen(true);
    }
  };

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
                label: 'Create Event',
                icon: <PlusCircle className="h-4 w-4" />,
                onClick: () => setIsCreateDialogOpen(true),
              }]}
              height="16rem"
            />
          )}
          <EventCalendarView
            events={events}
            isLoading={loading}
            onEventClick={handleEventClick}
            onDayClick={handleDayClick}
          />
        </div>
      </div>

      {/* Create Event Dialog */}
      <CreateEventDialog
        isOpen={isCreateDialogOpen}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setSelectedDate('');
        }}
        members={members}
        communityId={community.communityId}
        communityName={community.name}
        onEventCreated={handleEventCreated}
        initialDate={selectedDate}
      />
    </div>
  );
}
