import { NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, phone, newsletter, whatsapp } = body;

    if (!email || !firstName || !lastName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('✅ Adding to waitlist:', email);

    // Check if Firebase Admin is properly configured
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // If admin SDK not configured, use client-side approach
      return NextResponse.json({ 
        error: 'Firebase Admin not configured. Please add request manually.',
        requiresManualAdd: true,
        userData: body
      }, { status: 500 });
    }

    try {
      // Store in Firestore
      const waitlistRef = db.collection('waitlist');
      
      // Check if already exists
      const existingSnapshot = await waitlistRef.where('email', '==', email).get();
      
      if (!existingSnapshot.empty) {
        return NextResponse.json({ 
          message: 'User already in waitlist',
          requestId: existingSnapshot.docs[0].id
        }, { status: 200 });
      }

      const docRef = await waitlistRef.add({
        email,
        firstName,
        lastName,
        phone,
        newsletter: !!newsletter,
        whatsapp: !!whatsapp,
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });

      console.log('✅ Added to waitlist with ID:', docRef.id);

      return NextResponse.json({ 
        message: 'Successfully added to waitlist',
        requestId: docRef.id
      }, { status: 200 });

    } catch (firestoreError) {
      console.error('Firestore error:', firestoreError);
      
      // Return data for manual addition
      return NextResponse.json({ 
        error: 'Failed to add to Firestore',
        requiresManualAdd: true,
        userData: body
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error adding to waitlist:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
}
