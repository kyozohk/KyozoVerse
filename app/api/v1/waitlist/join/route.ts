import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyApiKeyOrBearer } from '@/lib/api-key-auth';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * POST /api/v1/waitlist/join
 *
 * Body:
 *   {
 *     email: string,
 *     firstName: string,
 *     lastName: string,
 *     phone: string,
 *     newsletter?: boolean,
 *     whatsapp?: boolean,
 *     agreedToPrivacy: boolean,
 *     source?: string
 *   }
 */
export async function POST(request: NextRequest) {
  const auth = await verifyApiKeyOrBearer(request, { scope: 'waitlist:write' });
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const email = ((body?.email || '') as string).trim().toLowerCase();
    const firstName = ((body?.firstName || '') as string).trim();
    const lastName = ((body?.lastName || '') as string).trim();
    const phone = ((body?.phone || '') as string).trim();
    const newsletter = !!body?.newsletter;
    const whatsapp = !!body?.whatsapp;
    const agreedToPrivacy = !!body?.agreedToPrivacy;
    const source = (body?.source || 'kyozo_api_v1') as string;

    if (!firstName || !lastName || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields', code: 'MISSING_FIELD' },
        { status: 400 }
      );
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address', code: 'INVALID_EMAIL' }, { status: 400 });
    }
    if (!agreedToPrivacy) {
      return NextResponse.json(
        { error: 'Privacy policy consent is required', code: 'CONSENT_REQUIRED' },
        { status: 400 }
      );
    }

    const ref = db.collection('accessRequests').doc(email);
    const existing = await ref.get();

    if (existing.exists) {
      const existingStatus = existing.data()?.status;
      if (existingStatus === 'approved') {
        return NextResponse.json({ message: 'Request already approved', requestId: ref.id, status: 'approved' });
      }
      await ref.set(
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
      return NextResponse.json({ message: 'Request already submitted', requestId: ref.id, status: existingStatus || 'pending' });
    }

    await ref.set({
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

    return NextResponse.json({ message: 'Successfully added to waitlist', requestId: ref.id, status: 'pending' });
  } catch (e) {
    console.error('[v1/waitlist/join]', e);
    return NextResponse.json(
      { error: (e as Error).message || 'Unexpected error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
