/**
 * Contacts server library.
 *
 * The only sanctioned way to write to the `contacts` and `communityAudience`
 * collections. Every function in this module:
 *   - Stamps `workspaceId` on every doc
 *   - Computes the dedup key from normalized phone/email
 *   - Merges into an existing contact if the dedup key already exists
 *   - Batches writes at Firestore's 500-doc-per-tx limit
 *
 * NEVER call db.collection('contacts') directly from a route handler. Always
 * go through here. That invariant is the foundation of multi-tenant isolation.
 */

import {
  FieldValue,
  type WriteBatch,
  Timestamp,
} from 'firebase-admin/firestore';
import { db } from '@/firebase/admin';
import {
  COLLECTIONS,
  type Contact,
  type ContactEvent,
  type ContactSourceProvider,
  type ContactSourceRecord,
  type CommunityAudience,
} from './types';
import {
  computeDedupKey,
  countryFromPhone,
  normalizeE164,
  normalizeEmail,
  sanitizeCellValue,
} from './dedup';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

/** Shape that callers pass in. Free-form; this module normalizes. */
export interface ContactInput {
  /** Raw or already-normalized; will be canonicalized. */
  phone?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  /** Provider-side identifier of this row (Eventbrite attendee id, CSV row hash, etc.) */
  providerRecordId: string;
  /** Optional events observed on this row. */
  events?: Array<{ name: string; date?: Date | string | null; eventKey?: string }>;
  /** Default country for E.164 parsing when the input phone lacks one. */
  defaultCountry?: string;
}

export interface UpsertStats {
  created: number;
  merged: number;
  skippedNoIdentity: number;
}

/* -------------------------------------------------------------------------- */
/*  Single upsert                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Upsert one contact. Returns the contactId and whether this was a new doc.
 *
 * If `input` has neither phone nor email after normalization, the upsert is
 * skipped (no identity → can't dedup → can't be confident this is the same
 * person as anyone). Caller decides whether that's an error or a soft skip.
 */
export async function upsertContact(
  workspaceId: string,
  source: { provider: ContactSourceProvider; importId: string },
  input: ContactInput
): Promise<
  | { ok: true; contactId: string; created: boolean; merged: boolean }
  | { ok: false; reason: 'no_identity' }
> {
  const phoneE164 =
    normalizeE164(input.phone || undefined, input.defaultCountry as any) || undefined;
  const emailLower = normalizeEmail(input.email || undefined) || undefined;
  const dedupKey = computeDedupKey(workspaceId, { phoneE164, emailLower });
  if (!dedupKey) return { ok: false, reason: 'no_identity' };

  const countryCode =
    countryFromPhone(input.phone || undefined, input.defaultCountry as any) || undefined;

  // Look up by dedupKey. We use a query (indexed) rather than doc-by-id
  // because dedupKey isn't part of the docId — that lets contacts retain
  // human-friendly ids even if a workspace is renamed/migrated.
  const existing = await db
    .collection(COLLECTIONS.contacts)
    .where('workspaceId', '==', workspaceId)
    .where('dedupKey', '==', dedupKey)
    .limit(1)
    .get();

  const sourceRecord: ContactSourceRecord = {
    provider: source.provider,
    providerRecordId: sanitizeCellValue(input.providerRecordId),
    importedAt: FieldValue.serverTimestamp(),
    importId: source.importId,
  };

  const events: ContactEvent[] = (input.events || []).map((e) => ({
    provider: source.provider,
    eventKey: sanitizeCellValue(e.eventKey || `${source.provider}:${e.name}`),
    name: sanitizeCellValue(e.name),
    date:
      e.date instanceof Date
        ? Timestamp.fromDate(e.date)
        : typeof e.date === 'string'
          ? Timestamp.fromDate(new Date(e.date))
          : undefined,
    countryCode: countryCode || undefined,
  }));

  if (!existing.empty) {
    // Merge into existing
    const ref = existing.docs[0].ref;
    const patch: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
      sources: FieldValue.arrayUnion(sourceRecord),
    };
    if (phoneE164) patch.phoneE164 = phoneE164;
    if (emailLower) patch.emailLower = emailLower;
    if (countryCode) patch.countryCode = countryCode;
    if (input.firstName) patch.firstName = sanitizeCellValue(input.firstName);
    if (input.lastName) patch.lastName = sanitizeCellValue(input.lastName);
    if (input.displayName) patch.displayName = sanitizeCellValue(input.displayName);
    if (events.length) patch.events = FieldValue.arrayUnion(...events);
    await ref.update(patch);
    return { ok: true, contactId: ref.id, created: false, merged: true };
  }

  // Create new
  const ref = db.collection(COLLECTIONS.contacts).doc();
  const doc: Contact = {
    contactId: ref.id,
    workspaceId,
    dedupKey,
    displayName: input.displayName
      ? sanitizeCellValue(input.displayName)
      : [input.firstName, input.lastName]
          .filter(Boolean)
          .map((s) => sanitizeCellValue(s!))
          .join(' ') || undefined,
    firstName: input.firstName ? sanitizeCellValue(input.firstName) : undefined,
    lastName: input.lastName ? sanitizeCellValue(input.lastName) : undefined,
    emailLower,
    phoneE164,
    countryCode,
    sources: [sourceRecord],
    communityIds: [],
    importTags: [],
    events,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  // Strip undefineds; Firestore rejects them.
  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(doc)) {
    if (v !== undefined) cleaned[k] = v;
  }
  await ref.set(cleaned);
  return { ok: true, contactId: ref.id, created: true, merged: false };
}

/* -------------------------------------------------------------------------- */
/*  Bulk upsert                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Upsert many contacts in one pass, batched at Firestore's 500-doc-per-tx
 * limit. Two-phase:
 *   1. Pre-resolve dedup keys to existing contactIds (avoids per-row reads).
 *   2. Build write batches (creates + merges) and commit.
 *
 * Tradeoff: the pre-resolve pass uses `in` queries (capped at 30 ids per
 * call), so 10k contacts → ~334 reads. Reads are cheap; correctness wins.
 */
export async function bulkUpsertContacts(
  workspaceId: string,
  source: { provider: ContactSourceProvider; importId: string },
  inputs: ContactInput[]
): Promise<{ stats: UpsertStats; contactIds: string[] }> {
  const stats: UpsertStats = { created: 0, merged: 0, skippedNoIdentity: 0 };
  const contactIds: string[] = [];

  // 1) Normalize + compute keys upfront. Skip identity-less rows.
  type Resolved = {
    input: ContactInput;
    phoneE164?: string;
    emailLower?: string;
    countryCode?: string;
    dedupKey: string;
  };
  const resolved: Resolved[] = [];
  for (const input of inputs) {
    const phoneE164 =
      normalizeE164(input.phone || undefined, input.defaultCountry as any) || undefined;
    const emailLower = normalizeEmail(input.email || undefined) || undefined;
    const dedupKey = computeDedupKey(workspaceId, { phoneE164, emailLower });
    if (!dedupKey) {
      stats.skippedNoIdentity += 1;
      continue;
    }
    const countryCode =
      countryFromPhone(input.phone || undefined, input.defaultCountry as any) || undefined;
    resolved.push({ input, phoneE164, emailLower, countryCode, dedupKey });
  }

  // 2) Resolve existing contacts in chunks of 30 (Firestore `in` limit).
  // Within a single input batch we may have multiple rows with the same key
  // (the input file had duplicates); dedupe to one upsert intent per key
  // and apply the union of fields/events.
  const byKey = new Map<string, Resolved & { events: ContactEvent[] }>();
  for (const r of resolved) {
    const evts: ContactEvent[] = (r.input.events || []).map((e) => ({
      provider: source.provider,
      eventKey: sanitizeCellValue(e.eventKey || `${source.provider}:${e.name}`),
      name: sanitizeCellValue(e.name),
      date:
        e.date instanceof Date
          ? Timestamp.fromDate(e.date)
          : typeof e.date === 'string'
            ? Timestamp.fromDate(new Date(e.date))
            : undefined,
      countryCode: r.countryCode,
    }));
    const existing = byKey.get(r.dedupKey);
    if (existing) {
      existing.events.push(...evts);
      // Field union — prefer non-empty incoming over existing
      existing.input.firstName ||= r.input.firstName;
      existing.input.lastName ||= r.input.lastName;
      existing.input.displayName ||= r.input.displayName;
      existing.phoneE164 ||= r.phoneE164;
      existing.emailLower ||= r.emailLower;
      existing.countryCode ||= r.countryCode;
    } else {
      byKey.set(r.dedupKey, { ...r, events: evts });
    }
  }

  const keys = [...byKey.keys()];
  const keyToContactId = new Map<string, string>();
  for (let i = 0; i < keys.length; i += 30) {
    const chunk = keys.slice(i, i + 30);
    const snap = await db
      .collection(COLLECTIONS.contacts)
      .where('workspaceId', '==', workspaceId)
      .where('dedupKey', 'in', chunk)
      .get();
    for (const d of snap.docs) {
      keyToContactId.set(d.data().dedupKey, d.id);
    }
  }

  // 3) Build write batches: existing rows get update(), new rows get set().
  const all = [...byKey.values()];
  let batch: WriteBatch = db.batch();
  let inBatch = 0;
  const FLUSH = 450; // leave headroom under the 500 cap

  async function flush() {
    if (inBatch === 0) return;
    await batch.commit();
    batch = db.batch();
    inBatch = 0;
  }

  for (const r of all) {
    const sourceRecord: ContactSourceRecord = {
      provider: source.provider,
      providerRecordId: sanitizeCellValue(r.input.providerRecordId),
      importedAt: FieldValue.serverTimestamp(),
      importId: source.importId,
    };

    const existingId = keyToContactId.get(r.dedupKey);
    if (existingId) {
      const ref = db.collection(COLLECTIONS.contacts).doc(existingId);
      const patch: Record<string, unknown> = {
        updatedAt: FieldValue.serverTimestamp(),
        sources: FieldValue.arrayUnion(sourceRecord),
      };
      if (r.phoneE164) patch.phoneE164 = r.phoneE164;
      if (r.emailLower) patch.emailLower = r.emailLower;
      if (r.countryCode) patch.countryCode = r.countryCode;
      if (r.input.firstName) patch.firstName = sanitizeCellValue(r.input.firstName);
      if (r.input.lastName) patch.lastName = sanitizeCellValue(r.input.lastName);
      if (r.input.displayName) patch.displayName = sanitizeCellValue(r.input.displayName);
      if (r.events.length) patch.events = FieldValue.arrayUnion(...r.events);
      batch.update(ref, patch);
      contactIds.push(existingId);
      stats.merged += 1;
    } else {
      const ref = db.collection(COLLECTIONS.contacts).doc();
      const doc: Contact = {
        contactId: ref.id,
        workspaceId,
        dedupKey: r.dedupKey,
        displayName: r.input.displayName
          ? sanitizeCellValue(r.input.displayName)
          : [r.input.firstName, r.input.lastName]
              .filter(Boolean)
              .map((s) => sanitizeCellValue(s!))
              .join(' ') || undefined,
        firstName: r.input.firstName ? sanitizeCellValue(r.input.firstName) : undefined,
        lastName: r.input.lastName ? sanitizeCellValue(r.input.lastName) : undefined,
        emailLower: r.emailLower,
        phoneE164: r.phoneE164,
        countryCode: r.countryCode,
        sources: [sourceRecord],
        communityIds: [],
        importTags: [],
        events: r.events,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      const cleaned: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(doc)) {
        if (v !== undefined) cleaned[k] = v;
      }
      batch.set(ref, cleaned);
      keyToContactId.set(r.dedupKey, ref.id);
      contactIds.push(ref.id);
      stats.created += 1;
    }

    inBatch += 1;
    if (inBatch >= FLUSH) await flush();
  }
  await flush();

  return { stats, contactIds };
}

/* -------------------------------------------------------------------------- */
/*  Community audience tagging                                                */
/* -------------------------------------------------------------------------- */

/**
 * Attach contacts to a community as audience tags (soft membership).
 * Idempotent — adding the same contact twice is a no-op. Updates the
 * contact's `communityIds` mirror and increments the community's
 * `audienceCount` (best-effort transaction).
 */
export async function attachContactsToCommunity(
  workspaceId: string,
  communityId: string,
  contactIds: string[],
  addedByUid: string
): Promise<{ added: number; skipped: number }> {
  let added = 0;
  let skipped = 0;
  let batch = db.batch();
  let inBatch = 0;
  const FLUSH = 400;

  async function flush() {
    if (inBatch === 0) return;
    await batch.commit();
    batch = db.batch();
    inBatch = 0;
  }

  for (const contactId of contactIds) {
    const audienceId = `${workspaceId}_${communityId}_${contactId}`;
    const ref = db.collection(COLLECTIONS.communityAudience).doc(audienceId);
    const existing = await ref.get();
    if (existing.exists) {
      skipped += 1;
      continue;
    }
    const doc: CommunityAudience = {
      audienceId,
      workspaceId,
      communityId,
      contactId,
      tags: [],
      addedByUid,
      addedAt: FieldValue.serverTimestamp(),
    };
    batch.set(ref, doc);
    batch.update(db.collection(COLLECTIONS.contacts).doc(contactId), {
      communityIds: FieldValue.arrayUnion(communityId),
      updatedAt: FieldValue.serverTimestamp(),
    });
    inBatch += 2;
    added += 1;
    if (inBatch >= FLUSH) await flush();
  }
  await flush();

  // Update audienceCount on the community (best-effort; not transactional
  // because we already committed above and a single transactional pass over
  // 10k+ docs would exceed Firestore limits).
  if (added > 0) {
    try {
      await db
        .collection(COLLECTIONS.communities)
        .doc(communityId)
        .update({
          audienceCount: FieldValue.increment(added),
          workspaceId, // back-stamp for legacy docs that pre-date workspaceId
        });
    } catch (e) {
      console.warn('[contacts] audienceCount update failed:', e);
    }
  }

  return { added, skipped };
}

/**
 * Apply an import-name tag to every contact in the batch. The tag becomes
 * filterable in the Audience view of every community the contact lands in.
 */
export async function applyImportTagToContacts(
  workspaceId: string,
  importId: string,
  importName: string,
  contactIds: string[]
): Promise<void> {
  let batch = db.batch();
  let inBatch = 0;
  const FLUSH = 400;

  async function flush() {
    if (inBatch === 0) return;
    await batch.commit();
    batch = db.batch();
    inBatch = 0;
  }

  const tag = { importId, name: importName };

  for (const contactId of contactIds) {
    batch.update(db.collection(COLLECTIONS.contacts).doc(contactId), {
      importTags: FieldValue.arrayUnion(tag),
      updatedAt: FieldValue.serverTimestamp(),
    });
    inBatch += 1;
    if (inBatch >= FLUSH) await flush();
  }
  await flush();
}
