import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/api-auth';

const SA_PASSWORD = 'kyozo123';

export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (authResult.error) return authResult.error;

  const pwd = request.headers.get('x-sa-password');
  if (pwd !== SA_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch ALL users with pagination
    const authUsers: any[] = [];
    let pageToken: string | undefined;
    
    do {
      const listUsersResult = await adminAuth.listUsers(1000, pageToken);
      authUsers.push(...listUsersResult.users.map(u => ({
        uid: u.uid,
        email: u.email || '',
        displayName: u.displayName || u.email || u.uid,
        photoURL: u.photoURL || null,
        createdAt: u.metadata.creationTime,
      })));
      pageToken = listUsersResult.pageToken;
    } while (pageToken);

    const communitiesSnap = await adminDb.collection('communities').get();
    const communities = communitiesSnap.docs.map(doc => ({
      communityId: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ users: authUsers, communities });
  } catch (error: any) {
    console.error('SA data fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch data', message: error.message }, { status: 500 });
  }
}
