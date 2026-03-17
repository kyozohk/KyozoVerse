import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

const SA_PASSWORD = 'kyozo123';

export async function GET(request: NextRequest) {
  const pwd = request.headers.get('x-sa-password');
  if (pwd !== SA_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch all users from Firebase Auth
    const listUsersResult = await adminAuth.listUsers(1000);
    const authUsers = listUsersResult.users.map(u => ({
      uid: u.uid,
      email: u.email || '',
      displayName: u.displayName || u.email || u.uid,
      photoURL: u.photoURL || null,
      createdAt: u.metadata.creationTime,
    }));

    // Fetch all communities from Firestore
    const communitiesSnap = await adminDb.collection('communities').get();
    const communities = communitiesSnap.docs.map(doc => ({
      communityId: doc.id,
      ...doc.data(),
    }));

    // Group communities by ownerId
    const communitiesByOwner: Record<string, any[]> = {};
    communities.forEach(community => {
      const ownerId = (community as any).ownerId || 'unknown';
      if (!communitiesByOwner[ownerId]) {
        communitiesByOwner[ownerId] = [];
      }
      communitiesByOwner[ownerId].push(community);
    });

    return NextResponse.json({
      users: authUsers,
      communities,
      communitiesByOwner,
    });
  } catch (error: any) {
    console.error('SA data fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data', message: error.message },
      { status: 500 }
    );
  }
}
