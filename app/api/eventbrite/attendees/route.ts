import { NextResponse } from 'next/server';

const EVENTBRITE_API_BASE_URL = 'https://www.eventbriteapi.com/v3';

async function fetchAttendees(eventId: string, token: string) {
  try {
    const response = await fetch(`${EVENTBRITE_API_BASE_URL}/events/${eventId}/attendees/?status=attending`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error_description || 'Failed to fetch attendees from Eventbrite');
    }
    
    const data = await response.json();
    return data.attendees;
  } catch (error) {
    console.error('Error fetching Eventbrite attendees:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { token, eventId } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }
    
    const attendees = await fetchAttendees(eventId, token);
    
    return NextResponse.json({ 
      success: true,
      attendees: attendees
    });
    
  } catch (error: any) {
    console.error('Error fetching Eventbrite attendees:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch attendees' },
      { status: 500 }
    );
  }
}
