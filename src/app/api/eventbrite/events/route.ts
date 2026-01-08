import { NextResponse } from 'next/server';

const EVENTBRITE_API_BASE_URL = 'https://www.eventbriteapi.com/v3';

async function fetchEvents(token: string) {
  try {
    const userResponse = await fetch(`${EVENTBRITE_API_BASE_URL}/users/me/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!userResponse.ok) {
      const errorData = await userResponse.json();
      throw new Error(errorData.error_description || 'Failed to authenticate with Eventbrite');
    }
    
    const orgsResponse = await fetch(`${EVENTBRITE_API_BASE_URL}/users/me/organizations/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!orgsResponse.ok) {
      const errorData = await orgsResponse.json();
      throw new Error(errorData.error_description || 'Failed to fetch organizations from Eventbrite');
    }
    
    const orgsData = await orgsResponse.json();
    
    if (!orgsData.organizations || orgsData.organizations.length === 0) {
      throw new Error('No organizations found for this Eventbrite account');
    }
    
    let allEvents: any[] = [];
    
    for (const org of orgsData.organizations) {
      try {
        const response = await fetch(`${EVENTBRITE_API_BASE_URL}/organizations/${org.id}/events/?status=live,ended&expand=venue,ticket_classes`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.events && data.events.length > 0) {
            allEvents = allEvents.concat(data.events);
          }
        }
      } catch (error) {
        console.warn(`Error fetching events for organization ${org.name}:`, error);
      }
    }
    
    if (allEvents.length === 0) {
      throw new Error('No events found in any of your Eventbrite organizations');
    }
    
    return allEvents;
  } catch (error) {
    console.error('Error fetching Eventbrite events:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }
    
    const events = await fetchEvents(token);
    
    return NextResponse.json({ 
      success: true,
      events: events
    });
    
  } catch (error: any) {
    console.error('Error fetching Eventbrite events:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
