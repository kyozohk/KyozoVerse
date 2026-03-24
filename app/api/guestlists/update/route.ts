import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    await adminAuth.verifyIdToken(idToken);

    const { guestlistId, data } = await req.json();
    if (!guestlistId || !data) {
      return NextResponse.json({ error: 'guestlistId and data are required' }, { status: 400 });
    }

    await adminDb.collection('guestlists').doc(guestlistId).update({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating guestlist:', error);
    return NextResponse.json({ error: error.message || 'Failed to update' }, { status: 500 });
  }
}
