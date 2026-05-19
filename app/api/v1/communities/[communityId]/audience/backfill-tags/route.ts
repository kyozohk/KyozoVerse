/**
 * POST /api/v1/communities/:communityId/audience/backfill-tags
 *
 * One-shot recovery: scans every member doc in this community, collects the
 * union of `tags[]` values, and ensures every distinct tag name has a doc in
 * `communities/{id}/tags/{tagId}`.
 *
 * This is the fix for imports that ran before the server endpoint started
 * writing the tag subcollection. After this runs once per community, the
 * Manage Tag dialog will see the tags.
 *
 * Auth: community owner or admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { verifyAuth } from '@/lib/api-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> }
) {
  const auth = await verifyAuth(request);
  if (auth.error) return auth.error;
  const uid = auth.uid!;

  const { communityId } = await params;
  if (!communityId) {
    return NextResponse.json(
      { error: 'Missing communityId', code: 'MISSING_FIELD' },
      { status: 400 }
    );
  }

  // ---- ownership check ----
  const cSnap = await db.collection('communities').doc(communityId).get();
  if (!cSnap.exists) {
    return NextResponse.json({ error: 'Community not found', code: 'NOT_FOUND' }, { status: 404 });
  }
  const c = cSnap.data() as { ownerId?: string };
  const isOwner = c.ownerId === uid;
  let isAdmin = false;
  if (!isOwner) {
    const mSnap = await db.collection('communityMembers').doc(`${uid}_${communityId}`).get();
    if (mSnap.exists) {
      const m = mSnap.data() as { role?: string };
      isAdmin = m.role === 'admin' || m.role === 'owner';
    }
  }
  if (!isOwner && !isAdmin) {
    return NextResponse.json(
      { error: 'Only community owners/admins can backfill tags', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }

  // ---- scan members ----
  const memberSnap = await db
    .collection('communityMembers')
    .where('communityId', '==', communityId)
    .get();

  const seen = new Set<string>();
  for (const d of memberSnap.docs) {
    const data = d.data() as { tags?: string[]; importTag?: string };
    if (Array.isArray(data.tags)) {
      for (const t of data.tags) {
        if (typeof t === 'string' && t.trim()) seen.add(t.trim());
      }
    }
    if (typeof data.importTag === 'string' && data.importTag.trim()) {
      seen.add(data.importTag.trim());
    }
  }

  // ---- write to subcollection ----
  const tagNames = [...seen];
  let written = 0;
  const tagsRef = db.collection('communities').doc(communityId).collection('tags');
  for (const name of tagNames) {
    const tagId = name.toLowerCase().replace(/\s+/g, '-');
    await tagsRef.doc(tagId).set(
      { name, createdAt: Timestamp.now() },
      { merge: true }
    );
    written += 1;
  }

  return NextResponse.json({
    communityId,
    membersScanned: memberSnap.size,
    tagsFound: tagNames,
    tagsWritten: written,
  });
}
