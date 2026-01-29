'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Community } from '@/lib/types';
import { Globe, Lock, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';

export default function SchedulePage() {
  const params = useParams();
  const handle = params.handle as string;
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'Month' | 'Week' | 'Day' | 'Agenda'>('Month');

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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: (number | null)[] = [];
    
    // Add empty cells for days before the first day of the month
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
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
    const isCurrentMonth = index >= startingDay && index < startingDay + daysInMonth;
    return isCurrentMonth && 
           day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  const isCurrentMonth = (index: number) => {
    return index >= startingDay && index < startingDay + daysInMonth;
  };

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
            <div className="mb-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#5B4A3A' }}>COMMUNITY CALENDAR</h2>
              <p className="text-sm" style={{ color: '#8B7355' }}>Schedule and manage your creative community events</p>
            </div>
            
            {/* Calendar Controls */}
            <div className="flex items-center justify-between mb-4">
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
              <div className="flex items-center gap-1">
                {(['Month', 'Week', 'Day', 'Agenda'] as const).map((mode) => (
                  <Button
                    key={mode}
                    variant={viewMode === mode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode(mode)}
                    style={viewMode === mode ? { backgroundColor: '#5B4A3A' } : {}}
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Calendar Grid */}
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
                {days.map((day, index) => (
                  <div
                    key={index}
                    className={`min-h-[80px] p-2 border-b border-r cursor-pointer hover:bg-gray-50 transition-colors ${
                      isToday(day as number, index) ? 'bg-blue-50' : ''
                    }`}
                    style={{ 
                      borderColor: '#E8DFD1',
                      backgroundColor: !isCurrentMonth(index) ? '#F9F7F5' : undefined
                    }}
                  >
                    <span 
                      className={`text-sm ${
                        isCurrentMonth(index) ? 'text-[#5B4A3A]' : 'text-[#C4B5A5]'
                      }`}
                    >
                      {day}
                    </span>
                  </div>
                ))}
              </div>
            </div>
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
