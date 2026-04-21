import { NextRequest, NextResponse } from 'next/server';
import { auth as adminAuth, db as adminDb } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {

    const body = await request.json();
    const { firstName, lastName, email, password, phone, communityId, communityHandle } = body;

    if (!firstName || !lastName || !email || !password || !communityId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const displayName = `${firstName.trim()} ${lastName.trim()}`;

    // Normalize phone
    let normalizedPhone = phone ? phone.trim().replace(/\s+/g, '') : '';
    if (normalizedPhone && !normalizedPhone.startsWith('+')) {
      normalizedPhone = '+' + normalizedPhone;
    }
    const wa_id = normalizedPhone ? normalizedPhone.replace(/\+/g, '') : '';

    // 1. Create Firebase Auth user (Admin SDK — no client auth state needed)
    let userRecord;
    try {
      userRecord = await adminAuth.createUser({
        email,
        password,
        displayName,
      });
    } catch (err: any) {
      if (err.code === 'auth/email-already-exists') {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please sign in instead.' },
          { status: 400 }
        );
      }
      throw err;
    }

    const userId = userRecord.uid;

    // 2. Create user document in Firestore (Admin SDK bypasses security rules)
    await adminDb.collection('users').doc(userId).set({
      userId,
      displayName,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email,
      phone: normalizedPhone || null,
      phoneNumber: normalizedPhone || null,
      wa_id: wa_id || null,
      createdAt: FieldValue.serverTimestamp(),
    });

    // 3. Add user as community member
    await adminDb.collection('communityMembers').add({
      userId,
      communityId,
      role: 'member',
      status: 'active',
      joinedAt: FieldValue.serverTimestamp(),
      userDetails: {
        displayName,
        email,
        avatarUrl: null,
        phone: normalizedPhone || null,
      },
    });

    // 4. Increment community member count
    await adminDb.collection('communities').doc(communityId).update({
      memberCount: FieldValue.increment(1),
    });

    console.log(`[join-community] Member joined: ${userId} → community ${communityId}`);

    return NextResponse.json({ success: true, userId });
  } catch (error: any) {
    console.error('[join-community] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}
