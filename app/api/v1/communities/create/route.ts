/**
 * POST /api/v1/communities/create
 *
 * Minimal community creation used by the reversed onboarding flow
 * (contacts → tag → community): the import dialog imports/cleans contacts
 * first, then calls this to create the community they'll be assigned to.
 *
 * Mirrors the core of CreateCommunityDialog (community doc + owner membership)
 * without the image-upload / email-domain steps, which the user can configure
 * later from community Settings.
 *
 * Request (JSON): { name, tags? }
 * Response (200): { communityId, handle }
 */

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyAuth } from '@/lib/api-auth';
import { db, auth as adminAuth } from '@/firebase/admin';

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/['"]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'community'
  );
}

async function uniqueHandle(base: string): Promise<string> {
  let handle = base;
  for (let i = 0; i < 50; i++) {
    const snap = await db.collection('communities').where('handle', '==', handle).limit(1).get();
    if (snap.empty) return handle;
    handle = `${base}-${i + 2}`;
  }
  return `${base}-${db.collection('communities').doc().id.slice(0, 6).toLowerCase()}`;
}

export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (authResult.error) return authResult.error;
  const uid = authResult.uid!;

  let body: { name?: string; tags?: string[]; description?: string };
  try {
    body = (await request.json()) as { name?: string; tags?: string[]; description?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const name = (body.name || '').trim();
  if (!name) {
    return NextResponse.json({ error: 'Community name is required', code: 'MISSING_FIELD' }, { status: 400 });
  }

  const handle = await uniqueHandle(slugify(name));
  const ref = db.collection('communities').doc();
  const communityId = ref.id;

  await ref.set({
    communityId,
    name,
    handle,
    ownerId: uid,
    isPrivate: false,
    visibility: 'public',
    tags: Array.isArray(body.tags) ? body.tags : [],
    lore: (body.description || '').trim(),
    memberCount: 1,
    createdAt: FieldValue.serverTimestamp(),
    createdViaImport: true,
  });

  // Owner membership (id matches the {uid}_{communityId} convention the import
  // route uses for its admin lookup).
  let userDetails: Record<string, unknown> = {};
  try {
    const u = await adminAuth.getUser(uid);
    const userDoc = await db.collection('users').doc(uid).get();
    const ud = userDoc.exists ? (userDoc.data() as Record<string, any>) : {};
    userDetails = {
      displayName: ud.displayName || u.displayName || 'Unknown',
      email: ud.email || u.email || '',
      avatarUrl: ud.avatarUrl || u.photoURL || null,
      phone: ud.phone || ud.phoneNumber || null,
    };
  } catch {
    /* non-fatal */
  }

  await db.collection('communityMembers').doc(`${uid}_${communityId}`).set({
    userId: uid,
    communityId,
    role: 'owner',
    status: 'active',
    joinedAt: FieldValue.serverTimestamp(),
    userDetails,
  });

  return NextResponse.json({ communityId, handle });
}
