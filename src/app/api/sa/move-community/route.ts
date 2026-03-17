import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

const SA_PASSWORD = 'kyozo123';

export async function POST(request: NextRequest) {
  const pwd = request.headers.get('x-sa-password');
  if (pwd !== SA_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { communityId, fromUserId, toUserId } = await request.json();

    if (!communityId || !fromUserId || !toUserId) {
      return NextResponse.json(
        { error: 'communityId, fromUserId, and toUserId are required' },
        { status: 400 }
      );
    }

    if (fromUserId === toUserId) {
      return NextResponse.json(
        { error: 'fromUserId and toUserId must be different' },
        { status: 400 }
      );
    }

    const batch = adminDb.batch();

    // 1. Update community ownerId
    const communityRef = adminDb.collection('communities').doc(communityId);
    const communitySnap = await communityRef.get();
    if (!communitySnap.exists) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }
    batch.update(communityRef, { ownerId: toUserId });

    // 2. Demote old owner in communityMembers (find their member doc)
    const oldOwnerQuery = await adminDb
      .collection('communityMembers')
      .where('communityId', '==', communityId)
      .where('userId', '==', fromUserId)
      .get();

    oldOwnerQuery.forEach(doc => {
      batch.update(doc.ref, { role: 'member' });
    });

    // 3. Promote new owner — update existing member doc or create one
    const newOwnerQuery = await adminDb
      .collection('communityMembers')
      .where('communityId', '==', communityId)
      .where('userId', '==', toUserId)
      .get();

    if (!newOwnerQuery.empty) {
      newOwnerQuery.forEach(doc => {
        batch.update(doc.ref, { role: 'owner' });
      });
    } else {
      // New owner isn't a member yet — create a member doc
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
    return NextResponse.json(
      { error: 'Failed to move community', message: error.message },
      { status: 500 }
    );
  }
}
