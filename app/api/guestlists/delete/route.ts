import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    await adminAuth.verifyIdToken(idToken);

    const { guestlistId } = await req.json();
    if (!guestlistId) {
      return NextResponse.json({ error: 'guestlistId is required' }, { status: 400 });
    }

    await adminDb.collection('guestlists').doc(guestlistId).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting guestlist:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete' }, { status: 500 });
  }
}
