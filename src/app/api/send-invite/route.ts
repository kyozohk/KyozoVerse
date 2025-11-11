
import { NextResponse } from 'next/server';
import { db } from '@/firebase/firestore';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, phone, newsletter, whatsapp } = body;

    if (!email || !firstName || !lastName || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if a request with this email already exists
    const requestsRef = collection(db, 'accessRequests');
    const q = query(requestsRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        return NextResponse.json({ message: 'You have already requested access.' }, { status: 200 });
    }

    // Add a new document with a generated id.
    await addDoc(requestsRef, {
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
