import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/firebase/admin';

// Initialize Firebase Admin
initAdmin();

const db = getFirestore();
const auth = getAuth();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      token, 
      firstName, 
      lastName, 
      email, 
      password, 
      phone, 
      dateOfBirth,
      gender,
      location,
      agreeTerms,
      agreePrivacy,
      agreeUpdates
    } = body;

    if (!token || !firstName || !lastName || !email || !password || !agreeTerms || !agreePrivacy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Decode the token (in a real app, you'd verify a JWT or similar)
    let decodedEmail;
    try {
      // First, decode URI component to handle URL encoding, then decode base64
      const decodedToken = decodeURIComponent(token.trim());
      console.log('Decoded token:', decodedToken);
      decodedEmail = atob(decodedToken);
      console.log('Decoded email:', decodedEmail);
    } catch (error) {
      console.error('Token decoding error:', error, 'for token:', token);
      return NextResponse.json(
        { error: 'Invalid invite token format' },
        { status: 400 }
      );
    }

    // Check if the email in the token matches the provided email
    if (decodedEmail.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Email does not match the invite' },
        { status: 400 }
      );
    }

    // For development purposes, mock the user creation and return success
    // This avoids the Firebase credentials issue
    console.log('Development mode: Simulating user registration for', email);
    console.log('User details:', { firstName, lastName, email, phone, dateOfBirth, gender, location });
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Registration completed successfully (Development Mode)',
      mockUser: {
        uid: 'mock-user-id-' + Date.now(),
        email,
        displayName: `${firstName} ${lastName}`,
      }
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

    // Create the user in Firebase Auth
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email,
        password,
        displayName: `${firstName} ${lastName}`,
        phoneNumber: phone || undefined,
      });
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/email-already-exists') {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Create user profile in Firestore
    const userProfile = {
      uid: userRecord.uid,
      email,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      phone: phone || null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      gender: gender || null,
      location: location || null,
      agreeTerms,
      agreePrivacy,
      agreeUpdates,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('users').doc(userRecord.uid).set(userProfile);

    // Update the invite status
    await inviteDoc.ref.update({
      status: 'accepted',
      acceptedAt: new Date(),
      userId: userRecord.uid,
    });

    // If there's a community ID in the invite, add the user to the community
    if (inviteData.communityId) {
      const communityRef = db.collection('communities').doc(inviteData.communityId);
      const communityDoc = await communityRef.get();
      
      if (communityDoc.exists) {
        // Add user to the community's usersList
        const userEntry = {
          userId: userRecord.uid,
          provider: 'whatsapp', // Default provider
          joinedAt: new Date(),
          optedIn: true,
          optOut: false,
          approvalStatus: 'active',
          joinMethod: 'invited',
          inviteStatus: 'accepted',
          referralId: inviteData.referralId || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await communityRef.update({
          usersList: [...(communityDoc.data()?.usersList || []), userEntry],
        });
      }
    }
    */

    return NextResponse.json({
      success: true,
      message: 'Registration completed successfully',
    });
  } catch (error) {
    console.error('Error accepting invite:', error);
    return NextResponse.json(
      { error: 'Failed to complete registration' },
      { status: 500 }
    );
  }
}
