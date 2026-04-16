import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkRateLimit } from '@/lib/api-auth';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request, 10, 60_000);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();

    const emailRaw = (body?.email || '') as string;
    const firstName = (body?.firstName || '') as string;
    const lastName = (body?.lastName || '') as string;
    const phone = (body?.phone || '') as string;
    const newsletter = !!body?.newsletter;
    const whatsapp = !!body?.whatsapp;
    const agreedToPrivacy = !!body?.agreedToPrivacy;
    const source = (body?.source || 'kyozoverse_waitlist_modal') as string;

    const email = emailRaw.trim().toLowerCase();

    if (!firstName?.trim() || !lastName?.trim() || !email || !phone?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    if (!agreedToPrivacy) {
      return NextResponse.json({ error: 'Privacy policy consent is required' }, { status: 400 });
    }

    const accessRequestsRef = db.collection('accessRequests');
    const docRef = accessRequestsRef.doc(email);

    const existing = await docRef.get();
    if (existing.exists) {
      const existingStatus = existing.data()?.status;
      if (existingStatus === 'approved') {
        return NextResponse.json({ message: 'Request already approved' }, { status: 200 });
      }

      await docRef.set(
        {
          email,
          firstName,
          lastName,
          phone,
          newsletter,
          whatsapp,
          agreedToPrivacy,
          source,
          status: existingStatus || 'pending',
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return NextResponse.json({ message: 'Request already submitted', requestId: docRef.id }, { status: 200 });
    }

    await docRef.set({
      email,
      firstName,
      lastName,
      phone,
      newsletter,
      whatsapp,
      agreedToPrivacy,
      source,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ message: 'Successfully added to waitlist', requestId: docRef.id }, { status: 200 });
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
