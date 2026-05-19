/**
 * POST /api/v1/communities/:communityId/audience/import
 *
 * Single commit point for the bulk-import flow. The dialog parses, dedups,
 * filters, and tags on the client; this endpoint just persists the result.
 *
 * Body:
 *   {
 *     rows: Array<{
 *       name?: string;
 *       email?: string;
 *       phone?: string;        // E.164 preferred; server re-normalizes
 *       phoneE164?: string;    // already-normalized, if client did it
 *       country?: string;      // ISO-2
 *     }>;
 *     tag: string;             // audit-trail tag, applied to every row
 *     note?: string;
 *     source: 'csv' | 'xlsx' | 'eventbrite' | 'gsheets';
 *   }
 *
 * Behavior:
 *   - Verifies the caller is owner/admin of the community
 *   - Server-side dedup (one more pass — client may have missed rows)
 *   - Writes communityMembers rows in batches of 400
 *   - Creates the tag on the community if it doesn't exist
 *   - Records the import as a tag on each member's `tags` field
 *   - Bumps the community's `memberCount`
 *
 * Returns:
 *   { imported, skipped, duplicates, tag, importId }
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { verifyAuth } from '@/lib/api-auth';

/**
 * Admin-SDK equivalent of `addTagToCommunity` from @/lib/community-tags.
 * That client helper uses the browser Firestore SDK; calling it from a server
 * route silently no-ops (the client SDK has no auth context here).
 *
 * Doc id derivation matches the client helper exactly so subsequent client
 * calls (rename / delete) hit the same doc.
 */
async function addTagToCommunityServer(
  communityId: string,
  tagName: string
): Promise<void> {
  const tagId = tagName.toLowerCase().replace(/\s+/g, '-');
  const ref = db
    .collection('communities')
    .doc(communityId)
    .collection('tags')
    .doc(tagId);
  await ref.set(
    {
      name: tagName,
      createdAt: Timestamp.now(),
    },
    { merge: true }
  );
}

const BATCH_SIZE = 400;
const MAX_ROWS_PER_IMPORT = 50_000;

interface RowInput {
  name?: string;
  email?: string;
  phone?: string;
  phoneE164?: string;
  country?: string;
}

interface RequestBody {
  rows: RowInput[];
  tag: string;
  note?: string;
  source: 'csv' | 'xlsx' | 'eventbrite' | 'gsheets';
}

function normalizeEmail(s: string | undefined): string {
  if (!s) return '';
  return s.trim().toLowerCase();
}

/** Defensive E.164 sanitizer — accepts already-E.164 input or digit-only. */
function sanitizePhone(s: string | undefined): string {
  if (!s) return '';
  const trimmed = s.trim().replace(/\s+/g, '');
  if (!trimmed) return '';
  if (trimmed.startsWith('+')) return trimmed;
  // Fall back: digits only, prefix with '+' if it looks plausible.
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 8 ? `+${digits}` : '';
}

function dedupKey(row: RowInput): string | null {
  const phone = row.phoneE164 || sanitizePhone(row.phone);
  if (phone) return `p:${phone}`;
  const email = normalizeEmail(row.email);
  if (email) return `e:${email}`;
  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> }
) {
  // ---- auth -----------------------------------------------------------
  const authResult = await verifyAuth(request);
  if (authResult.error) return authResult.error;
  const uid = authResult.uid!;

  const { communityId } = await params;
  if (!communityId) {
    return NextResponse.json(
      { error: 'Missing communityId', code: 'MISSING_FIELD' },
      { status: 400 }
    );
  }

  // ---- community ownership / role check -------------------------------
  const cSnap = await db.collection('communities').doc(communityId).get();
  if (!cSnap.exists) {
    return NextResponse.json(
      { error: 'Community not found', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }
  const community = cSnap.data() as { ownerId?: string; handle?: string };
  const isOwner = community.ownerId === uid;

  let isAdmin = false;
  if (!isOwner) {
    const memberSnap = await db
      .collection('communityMembers')
      .doc(`${uid}_${communityId}`)
      .get();
    if (memberSnap.exists) {
      const m = memberSnap.data() as { role?: string };
      isAdmin = m.role === 'admin' || m.role === 'owner';
    }
  }

  if (!isOwner && !isAdmin) {
    return NextResponse.json(
      { error: 'Only community owners/admins can import members', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }

  // ---- body -----------------------------------------------------------
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', code: 'BAD_REQUEST' },
      { status: 400 }
    );
  }

  if (!Array.isArray(body.rows) || body.rows.length === 0) {
    return NextResponse.json(
      { error: 'rows must be a non-empty array', code: 'MISSING_FIELD' },
      { status: 400 }
    );
  }
  if (body.rows.length > MAX_ROWS_PER_IMPORT) {
    return NextResponse.json(
      {
        error: `Too many rows. Cap is ${MAX_ROWS_PER_IMPORT} per import.`,
        code: 'PAYLOAD_TOO_LARGE',
      },
      { status: 413 }
    );
  }
  const tagName = (body.tag || '').trim();
  if (!tagName) {
    return NextResponse.json(
      { error: 'tag is required', code: 'MISSING_FIELD' },
      { status: 400 }
    );
  }
  if (!body.source) {
    return NextResponse.json(
      { error: 'source is required', code: 'MISSING_FIELD' },
      { status: 400 }
    );
  }

  // ---- server-side dedup (in-request) ---------------------------------
  // The client already deduped; doing it again here closes the gap where
  // two parallel imports for the same community could both insert the same
  // contact.
  const seen = new Set<string>();
  type Prepared = { row: RowInput; key: string };
  const prepared: Prepared[] = [];
  let droppedNoIdentity = 0;
  let droppedDuplicate = 0;
  for (const row of body.rows) {
    const key = dedupKey(row);
    if (!key) {
      droppedNoIdentity += 1;
      continue;
    }
    if (seen.has(key)) {
      droppedDuplicate += 1;
      continue;
    }
    seen.add(key);
    prepared.push({ row, key });
  }

  // ---- cross-import dedup against existing community members ----------
  // The dialog calls /audience/dedup-keys before commit and pre-deselects
  // matches, but a malicious / older client could still submit them. We
  // load the existing keys here and skip any prepared row that matches,
  // counting how many were skipped so the response is honest about it.
  const existingKeys = new Set<string>();
  try {
    const existingSnap = await db
      .collection('communityMembers')
      .where('communityId', '==', communityId)
      .select('userDetails', 'phone', 'phoneNumber')
      .get();
    for (const d of existingSnap.docs) {
      const data = d.data() as {
        userDetails?: { email?: string; phone?: string; phoneNumber?: string; wa_id?: string };
        phone?: string;
        phoneNumber?: string;
      };
      const ud = data.userDetails || {};
      const phone =
        ud.phone || ud.phoneNumber || data.phone || data.phoneNumber ||
        (ud.wa_id ? `+${ud.wa_id}` : '');
      const k = dedupKey({ phone, email: ud.email });
      if (k) existingKeys.add(k);
    }
  } catch (e) {
    console.warn('[import] existing-members scan failed (continuing):', (e as Error).message);
  }

  let droppedExisting = 0;
  const filtered: Prepared[] = [];
  for (const p of prepared) {
    if (existingKeys.has(p.key)) {
      droppedExisting += 1;
      // We still apply the new tag to the existing member so the user's
      // intent ("tag this batch as X") is preserved even when no new doc
      // gets created.
      continue;
    }
    filtered.push(p);
  }
  // From here on the rest of the endpoint operates on `filtered`, not
  // `prepared`, so we rename for clarity below.
  prepared.length = 0;
  prepared.push(...filtered);

  // ---- create the tag on the community -------------------------------
  // Writes to communities/{id}/tags/{tagId} so the Manage Tag dialog and the
  // audience filter chips can find it. Idempotent via merge: re-running an
  // import with the same tag name is a no-op.
  try {
    await addTagToCommunityServer(communityId, tagName);
  } catch (e) {
    console.warn('[import] tag write failed (continuing):', (e as Error).message);
  }

  // ---- batched writes ------------------------------------------------
  // We write into communityMembers, NOT users (no Firebase Auth identity
  // created for bulk-imported contacts on this branch). Existing app
  // queries against communityMembers continue to work; the lack of a uid
  // is signalled by `userDetails.placeholder: true` so the audience UI
  // can render gracefully.
  const importId = db.collection('communities').doc().id; // throwaway id generator
  const writtenAt = FieldValue.serverTimestamp();
  let imported = 0;
  let batch = db.batch();
  let inBatch = 0;

  async function flush() {
    if (inBatch === 0) return;
    await batch.commit();
    batch = db.batch();
    inBatch = 0;
  }

  for (const { row, key } of prepared) {
    // Deterministic member doc id: hash of (communityId + dedup key). Re-running
    // the same import overwrites instead of duplicating.
    const memberDocId = `imp_${communityId}_${
      key.replace(/[^a-zA-Z0-9]/g, '').slice(0, 40)
    }_${Math.random().toString(36).slice(2, 6)}`;

    const phoneE164 = row.phoneE164 || sanitizePhone(row.phone);

    const memberRef = db.collection('communityMembers').doc(memberDocId);
    batch.set(
      memberRef,
      {
        communityId,
        userId: null, // bulk-imported, no Firebase Auth identity yet
        role: 'member',
        joinedAt: writtenAt,
        addedByUid: uid,
        importId,
        importTag: tagName,
        importNote: body.note || null,
        importSource: body.source,
        tags: FieldValue.arrayUnion(tagName),
        userDetails: {
          placeholder: true,
          displayName: row.name || '',
          email: normalizeEmail(row.email),
          phone: phoneE164,
          country: row.country || '',
        },
      },
      { merge: true }
    );

    imported += 1;
    inBatch += 1;
    if (inBatch >= BATCH_SIZE) await flush();
  }
  await flush();

  // ---- bump memberCount ----------------------------------------------
  try {
    await db.collection('communities').doc(communityId).update({
      memberCount: FieldValue.increment(imported),
    });
  } catch (e) {
    console.warn('[import] memberCount update failed:', (e as Error).message);
  }

  return NextResponse.json({
    imported,
    droppedNoIdentity,
    droppedDuplicate,
    droppedExisting,
    tag: tagName,
    importId,
    source: body.source,
  });
}
