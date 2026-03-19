import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/api-auth';

const SA_PASSWORD = 'kyozo123';

export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (authResult.error) return authResult.error;

  const pwd = request.headers.get('x-sa-password');
  if (pwd !== SA_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { communityId, fromUserId, toUserId } = await request.json();

    if (!communityId || !fromUserId || !toUserId) {
      return NextResponse.json({ error: 'communityId, fromUserId, and toUserId are required' }, { status: 400 });
    }
    if (fromUserId === toUserId) {
      return NextResponse.json({ error: 'fromUserId and toUserId must be different' }, { status: 400 });
    }

    const batch = adminDb.batch();

    const communityRef = adminDb.collection('communities').doc(communityId);
    const communitySnap = await communityRef.get();
    if (!communitySnap.exists) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }
    batch.update(communityRef, { ownerId: toUserId });

    const oldOwnerQuery = await adminDb
      .collection('communityMembers')
      .where('communityId', '==', communityId)
      .where('userId', '==', fromUserId)
      .get();
    oldOwnerQuery.forEach(doc => batch.update(doc.ref, { role: 'member' }));

    const newOwnerQuery = await adminDb
      .collection('communityMembers')
      .where('communityId', '==', communityId)
      .where('userId', '==', toUserId)
      .get();

    if (!newOwnerQuery.empty) {
      newOwnerQuery.forEach(doc => batch.update(doc.ref, { role: 'owner' }));
    } else {
      const newMemberRef = adminDb.collection('communityMembers').doc();
      batch.set(newMemberRef, {
        userId: toUserId,
        communityId,
        role: 'owner',
        status: 'active',
        joinedAt: new Date(),
        userDetails: {},
      });
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Community ${communityId} moved from ${fromUserId} to ${toUserId}`,
    });
  } catch (error: any) {
    console.error('SA move-community error:', error);
    return NextResponse.json({ error: 'Failed to move community', message: error.message }, { status: 500 });
  }
}
