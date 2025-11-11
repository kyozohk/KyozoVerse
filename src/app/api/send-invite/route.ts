
import { NextResponse } from 'next/server';
import { adminDb } from '@/firebase/admin';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, phone, newsletter, whatsapp } = body;

    if (!email || !firstName || !lastName || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const requestsRef = adminDb.collection('accessRequests');
    const q = requestsRef.where('email', '==', email);
    const querySnapshot = await q.get();

    if (!querySnapshot.empty) {
        return NextResponse.json({ message: 'You have already requested access.' }, { status: 200 });
    }

    await requestsRef.add({
        email,
        firstName,
        lastName,
        phone,
        newsletter: !!newsletter,
        whatsapp: !!whatsapp,
        status: 'pending',
        createdAt: serverTimestamp(),
    });

    return NextResponse.json({ message: 'Your request has been submitted successfully!' }, { status: 200 });
  } catch (error) {
    console.error('Error processing access request:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
