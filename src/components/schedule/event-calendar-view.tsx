'use client';

import { useState, useMemo } from 'react';
import { Search, Grid, List, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Users, MapPin, Clock, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface CalendarEvent {
  id: string;
  name: string;
  eventName?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  description?: string;
  eventImage?: string;
  memberCount: number;
  members: any[];
  createdAt: any;
  tags?: string[];
}

interface EventCalendarViewProps {
  events: CalendarEvent[];
  isLoading?: boolean;
  onEventClick?: (event: CalendarEvent) => void;
}

type ViewMode = 'calendar' | 'cards' | 'list';

export function EventCalendarView({
  events,
  isLoading = false,
  onEventClick,
}: EventCalendarViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Filter events based on search
  const filteredEvents = useMemo(() => {
    if (!searchTerm) return events;
    const lowerSearch = searchTerm.toLowerCase();
    return events.filter(event => 
      event.name?.toLowerCase().includes(lowerSearch) ||
      event.eventName?.toLowerCase().includes(lowerSearch) ||
      event.eventLocation?.toLowerCase().includes(lowerSearch) ||
      event.description?.toLowerCase().includes(lowerSearch)
    );
  }, [events, searchTerm]);

  // Sort events by date for list/card views
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      if (!a.eventDate) return 1;
      if (!b.eventDate) return -1;
      return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
    });
  }, [filteredEvents]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: number[] = [];
    
    // Add days from previous month
    for (let i = 0; i < startingDay; i++) {
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      days.push(prevMonthLastDay - startingDay + i + 1);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(i);
    }
    
    return { days, startingDay, daysInMonth };
  };

  const { days, startingDay, daysInMonth } = getDaysInMonth(currentDate);

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (day: number, index: number) => {
    const today = new Date();
    const isCurrentMonthDay = index >= startingDay && index < startingDay + daysInMonth;
    return isCurrentMonthDay && 
           day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  const isCurrentMonth = (index: number) => {
    return index >= startingDay && index < startingDay + daysInMonth;
  };

  const getEventsForDay = (day: number, index: number) => {
    if (!isCurrentMonth(index)) return [];
    return filteredEvents.filter(event => {
      if (!event.eventDate) return false;
      const eventDate = new Date(event.eventDate);
      return eventDate.getDate() === day && 
             eventDate.getMonth() === currentDate.getMonth() &&
             eventDate.getFullYear() === currentDate.getFullYear();
    });
  };

  const formatEventDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Calendar View
  const renderCalendarView = () => (
    <div className="border rounded-lg overflow-hidden" style={{ borderColor: '#E8DFD1' }}>
      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b" style={{ borderColor: '#E8DFD1' }}>
        {dayNames.map((day) => (
          <div 
            key={day} 
            className="p-3 text-center text-sm font-medium"
            style={{ backgroundColor: '#F5F0EB', color: '#5B4A3A' }}
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Days */}
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dayEvents = getEventsForDay(day, index);

          return (
            <div
              key={index}
              className={cn(
                "min-h-[100px] p-2 border-b border-r cursor-pointer hover:bg-gray-50 transition-colors",
                isToday(day, index) && "bg-blue-50"
              )}
              style={{ 
                borderColor: '#E8DFD1',
                backgroundColor: !isCurrentMonth(index) ? '#F9F7F5' : undefined
              }}
            >
              <span 
                className={cn(
                  "text-sm font-medium",
                  isCurrentMonth(index) ? 'text-[#5B4A3A]' : 'text-[#C4B5A5]'
                )}
              >
                {day}
              </span>
              {/* Events for this day */}
              <div className="mt-1 space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    className="text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                    style={{ backgroundColor: '#E07B39', color: 'white' }}
                    title={event.eventName || event.name}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                  >
                    {event.eventTime && <span className="mr-1">{event.eventTime}</span>}
                    {event.eventName || event.name}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs px-1.5 py-0.5 text-[#8B7355]">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Cards/Icon View with event images
  const renderCardsView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {sortedEvents.length === 0 ? (
        <div className="col-span-full text-center py-16 text-muted-foreground">
          <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No events found.</p>
        </div>
      ) : (
        sortedEvents.map((event) => (
          <Card 
            key={event.id} 
            className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onEventClick?.(event)}
          >
            {/* Event Image */}
            <div 
              className="h-32 bg-cover bg-center flex items-center justify-center"
              style={{ 
                backgroundColor: '#E8DFD1',
                backgroundImage: event.eventImage ? `url(${event.eventImage})` : undefined
              }}
            >
              {!event.eventImage && (
                <div className="flex flex-col items-center text-[#8B7355]">
                  <CalendarIcon className="h-10 w-10 mb-1" />
                  <span className="text-xs">No Image</span>
                </div>
              )}
            </div>
            
            {/* Event Details */}
            <div className="p-4">
              <h3 className="font-semibold text-lg truncate mb-1" style={{ color: '#5B4A3A' }}>
                {event.eventName || event.name}
              </h3>
              
              {event.eventDate && (
                <div className="flex items-center gap-1 text-sm mb-1" style={{ color: '#8B7355' }}>
                  <CalendarIcon className="h-3.5 w-3.5" />
                  <span>{formatEventDate(event.eventDate)}</span>
                  {event.eventTime && (
                    <>
                      <Clock className="h-3.5 w-3.5 ml-2" />
                      <span>{event.eventTime}</span>
                    </>
                  )}
                </div>
              )}
              
              {event.eventLocation && (
                <div className="flex items-center gap-1 text-sm truncate mb-2" style={{ color: '#8B7355' }}>
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{event.eventLocation}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1 pt-2 border-t" style={{ borderColor: '#E8DFD1' }}>
                <Users className="h-4 w-4" style={{ color: '#E07B39' }} />
                <span className="text-sm font-medium" style={{ color: '#5B4A3A' }}>
                  {event.memberCount} Guest{event.memberCount === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );

  // List View
  const renderListView = () => (
    <div className="flex flex-col gap-3">
      {sortedEvents.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No events found.</p>
        </div>
      ) : (
        sortedEvents.map((event) => (
          <Card 
            key={event.id} 
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onEventClick?.(event)}
          >
            <div className="flex items-center gap-4">
              {/* Event Image Thumbnail */}
              <div 
                className="w-16 h-16 rounded-lg bg-cover bg-center flex-shrink-0 flex items-center justify-center"
                style={{ 
                  backgroundColor: '#E8DFD1',
                  backgroundImage: event.eventImage ? `url(${event.eventImage})` : undefined
                }}
              >
                {!event.eventImage && (
                  <CalendarIcon className="h-6 w-6 text-[#8B7355]" />
                )}
              </div>
              
              {/* Event Details */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate" style={{ color: '#5B4A3A' }}>
                  {event.eventName || event.name}
                </h3>
                <div className="flex items-center gap-4 mt-1 flex-wrap">
                  {event.eventDate && (
                    <div className="flex items-center gap-1 text-sm" style={{ color: '#8B7355' }}>
                      <CalendarIcon className="h-3.5 w-3.5" />
                      <span>{formatEventDate(event.eventDate)}</span>
                      {event.eventTime && <span>at {event.eventTime}</span>}
                    </div>
                  )}
                  {event.eventLocation && (
                    <div className="flex items-center gap-1 text-sm" style={{ color: '#8B7355' }}>
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[200px]">{event.eventLocation}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Guest Count */}
              <div className="flex items-center gap-1 flex-shrink-0" style={{ color: '#5B4A3A' }}>
                <Users className="h-4 w-4" style={{ color: '#E07B39' }} />
                <span className="text-sm font-medium">
                  {event.memberCount} Guest{event.memberCount === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E07B39]" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Controls */}
      <div className="p-6 space-y-4">
        {/* Search and View Toggle */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 rounded-md bg-secondary p-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('calendar')}
                className={cn(
                  "h-8 w-8",
                  viewMode === 'calendar' && "bg-background shadow-sm"
                )}
                title="Calendar View"
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('cards')}
                className={cn(
                  "h-8 w-8",
                  viewMode === 'cards' && "bg-background shadow-sm"
                )}
                title="Cards View"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('list')}
                className={cn(
                  "h-8 w-8",
                  viewMode === 'list' && "bg-background shadow-sm"
                )}
                title="List View"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar Navigation (only for calendar view) */}
        {viewMode === 'calendar' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
              <Button variant="outline" size="sm" onClick={goToPrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <h3 className="text-lg font-medium" style={{ color: '#5B4A3A' }}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <div className="w-[200px]" /> {/* Spacer for centering */}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-8">
        {viewMode === 'calendar' && renderCalendarView()}
        {viewMode === 'cards' && renderCardsView()}
        {viewMode === 'list' && renderListView()}
      </div>
    </div>
  );
}
