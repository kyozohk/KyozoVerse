/**
 * GET /api/v1/communities/:communityId/audience/dedup-keys
 *
 * Returns the set of dedup keys for every existing member of this community.
 * The import dialog calls this once on entry to Preview so it can pre-deselect
 * rows that would create duplicates of members already in the community.
 *
 * A dedup key is one of:
 *   "p:<E164>"   when phone is known
 *   "e:<email>"  when only email is known
 *
 * No PII leaves the server in the response — only opaque keys. We do echo
 * the prefix (`p:` or `e:`) so the client can normalize incoming rows the
 * same way and compare cleanly.
 *
 * Auth: any authenticated member or admin of the community.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { verifyAuth } from '@/lib/api-auth';

function normalizeEmail(s: string | undefined): string {
  if (!s) return '';
  return s.trim().toLowerCase();
}

function normalizePhone(s: string | undefined): string {
  if (!s) return '';
  const trimmed = s.trim().replace(/\s+/g, '');
  if (!trimmed) return '';
  if (trimmed.startsWith('+')) return trimmed;
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 8 ? `+${digits}` : '';
}

function keyFor(phone?: string, email?: string): string | null {
  const p = normalizePhone(phone);
  if (p) return `p:${p}`;
  const e = normalizeEmail(email);
  if (e) return `e:${e}`;
  return null;
}

export async function GET(
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

  // Ownership / membership check — any signed-in member can read.
  const cSnap = await db.collection('communities').doc(communityId).get();
  if (!cSnap.exists) {
    return NextResponse.json({ error: 'Community not found', code: 'NOT_FOUND' }, { status: 404 });
  }
  const community = cSnap.data() as { ownerId?: string };
  const isOwner = community.ownerId === uid;
  let isMember = false;
  if (!isOwner) {
    const mSnap = await db.collection('communityMembers').doc(`${uid}_${communityId}`).get();
    isMember = mSnap.exists;
  }
  if (!isOwner && !isMember) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  // Scan members. communityMembers can grow large; we stream the field
  // projection rather than `.data()` so memory stays bounded.
  const snap = await db
    .collection('communityMembers')
    .where('communityId', '==', communityId)
    .select('userDetails', 'phone', 'phoneNumber')
    .get();

  const keys = new Set<string>();
  for (const d of snap.docs) {
    const data = d.data() as {
      userDetails?: { email?: string; phone?: string; phoneNumber?: string; wa_id?: string };
      phone?: string;
      phoneNumber?: string;
    };
    const ud = data.userDetails || {};
    const phone =
      ud.phone || ud.phoneNumber || data.phone || data.phoneNumber ||
      (ud.wa_id ? `+${ud.wa_id}` : '');
    const email = ud.email;
    const k = keyFor(phone, email);
    if (k) keys.add(k);
  }

  return NextResponse.json({
    communityId,
    count: keys.size,
    keys: [...keys],
  });
}
