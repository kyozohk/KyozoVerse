import { NextRequest, NextResponse } from 'next/server';
import { db, initAdmin } from '@/firebase/admin';

// Initialize Firebase Admin
initAdmin();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Missing invite token' },
        { status: 400 }
      );
    }

    // Decode the token (in a real app, you'd verify a JWT or similar)
    // For this example, we're assuming the token is a base64 encoded email
    let email;
    try {
      // First, decode URI component to handle URL encoding, then decode base64
      const decodedToken = decodeURIComponent(token.trim());
      console.log('Decoded token:', decodedToken);
      email = atob(decodedToken);
      console.log('Decoded email:', email);
    } catch (error) {
      console.error('Token decoding error:', error, 'for token:', token);
      return NextResponse.json(
        { error: 'Invalid invite token format' },
        { status: 400 }
      );
    }

    // For development purposes, mock the invite data instead of using Firestore
    // This avoids the Firebase credentials issue
    // In production, you would use the actual Firestore query
    
    // Mock invite data
    const mockInviteData = {
      firstName: email.split('@')[0],
      lastName: '',
      email: email,
      phone: '',
      tempDateOfBirth: null,
      tempGender: '',
      tempLocation: '',
      communityName: 'Kyozo Demo Community',
    };
    
    // Return the mock invite data for development purposes
    return NextResponse.json({
      inviteData: mockInviteData
    });
    
    /* In production, you would use code like this:
    
    // Check if the invite exists in Firestore
    const invitesRef = db.collection('accessRequests');
    const inviteSnapshot = await invitesRef.where('email', '==', email).limit(1).get();

    if (inviteSnapshot.empty) {
      return NextResponse.json(
        { error: 'Invite not found or has expired' },
        { status: 404 }
      );
    }

    const inviteDoc = inviteSnapshot.docs[0];
    const inviteData = inviteDoc.data();

    // Check if the invite has already been accepted
    if (inviteData.status === 'accepted') {
      return NextResponse.json(
        { error: 'This invite has already been accepted' },
        { status: 400 }
      );
    }

    // Get community information if available
    let communityName = 'KyozoVerse';
    if (inviteData.communityId) {
      try {
        const communityDoc = await db.collection('communities').doc(inviteData.communityId).get();
        if (communityDoc.exists) {
          const communityData = communityDoc.data();
          communityName = communityData?.name || 'KyozoVerse';
        }
      } catch (error) {
        console.error('Error fetching community data:', error);
        // Continue with default community name
      }
    }

    // Return the invite data for the registration form
    return NextResponse.json({
      inviteData: {
        firstName: inviteData.firstName || inviteData.tempFirstName || '',
        lastName: inviteData.lastName || inviteData.tempLastName || '',
        email: inviteData.email || inviteData.tempEmail || '',
        phone: inviteData.phone || '',
        tempDateOfBirth: inviteData.tempDateOfBirth || null,
        tempGender: inviteData.tempGender || '',
        tempLocation: inviteData.tempLocation || '',
        communityName,
      },
    });
    */
  } catch (error) {
    console.error('Error verifying invite:', error);
    return NextResponse.json(
      { error: 'Failed to verify invite' },
      { status: 500 }
    );
  }
}
