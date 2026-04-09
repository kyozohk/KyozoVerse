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
import { EventDetailDialog } from '@/components/schedule/event-detail-dialog';
import { EventCalendarView, CalendarEvent } from '@/components/schedule/event-calendar-view';
import { useCommunityAccess } from '@/hooks/use-community-access';

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
  
  // Access control hook
  const { community, userRole, loading: accessLoading, hasAccess } = useCommunityAccess({
    handle,
    requireAuth: true,
    allowedRoles: ['owner', 'admin', 'member'],
    redirectOnDenied: true,
  });
  
  const [members, setMembers] = useState<MemberData[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // Fetch members
  useEffect(() => {
    const fetchMembers = async () => {
      if (!community?.communityId || accessLoading) return;
      
      try {
        const membersQuery = query(
          collection(db, 'communityMembers'),
          where('communityId', '==', community.communityId)
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
      } catch (error) {
        console.error('Error fetching members:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [community?.communityId, accessLoading]);

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
    setIsDetailDialogOpen(true);
  };

  const handleEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
    setIsCreateDialogOpen(true);
  };

  const handleDayClick = (date: Date, dayEvents: CalendarEvent[]) => {
    // Format date as YYYY-MM-DD using local timezone (not UTC) to avoid off-by-one errors
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
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

  if (accessLoading || loading) {
    return <PageLoadingSkeleton showMemberList={true} />;
  }

  if (!hasAccess) {
    return null;
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
              ctas={[{
                label: 'Create Event',
                icon: <PlusCircle className="h-4 w-4" />,
                onClick: () => {
                  // Set today's date as default when opening via header button
                  const today = new Date();
                  const todayFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                  setSelectedDate(todayFormatted);
                  setIsCreateDialogOpen(true);
                },
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
        key={editingEvent?.id || 'new'}
        isOpen={isCreateDialogOpen}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setSelectedDate('');
          setEditingEvent(null);
        }}
        members={members}
        communityId={community.communityId}
        communityName={community.name}
        onEventCreated={handleEventCreated}
        initialDate={selectedDate}
        existingEvent={editingEvent}
      />

      {/* Event Detail Dialog */}
      <EventDetailDialog
        isOpen={isDetailDialogOpen}
        onClose={() => {
          setIsDetailDialogOpen(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
        onEdit={handleEdit}
        onDelete={() => setSelectedEvent(null)}
      />
    </div>
  );
}
