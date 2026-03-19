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
    const communitiesSnap = await adminDb.collection('communities').get();
    const updates: { communityId: string; oldCount: number; newCount: number }[] = [];

    for (const communityDoc of communitiesSnap.docs) {
      const communityId = communityDoc.id;
      const oldCount = communityDoc.data().memberCount || 0;

      // Count actual members in communityMembers collection
      const membersSnap = await adminDb
        .collection('communityMembers')
        .where('communityId', '==', communityId)
        .count()
        .get();

      const newCount = membersSnap.data().count;

      if (oldCount !== newCount) {
        await adminDb.collection('communities').doc(communityId).update({
          memberCount: newCount,
        });
        updates.push({ communityId, oldCount, newCount });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${updates.length} communities`,
      updates,
    });
  } catch (error: any) {
    console.error('Sync member counts error:', error);
    return NextResponse.json(
      { error: 'Failed to sync', message: error.message },
      { status: 500 }
    );
  }
}
