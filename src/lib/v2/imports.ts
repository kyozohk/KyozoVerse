/**
 * Imports server library.
 *
 * Every "push to Kyozo" creates exactly one ImportBatch doc. The doc is
 * immutable after creation (its name becomes an audit-trail tag on every
 * contact in the batch — mutating it would silently rewrite history).
 *
 * Idempotency: writes are keyed by `sha256(workspaceId + name)`. Re-running
 * an import with the same name within the same workspace returns the
 * existing import doc without creating a new one. Callers can still
 * re-apply tags / re-tag contacts; the import object itself is stable.
 */

import { createHash } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '@/firebase/admin';
import {
  COLLECTIONS,
  type ImportBatch,
  type ContactSourceProvider,
} from './types';

function idempotencyKeyFor(workspaceId: string, name: string): string {
  return createHash('sha256').update(`${workspaceId}::${name}`).digest('hex');
}

/** Inputs for creating a new import. */
export interface CreateImportInput {
  workspaceId: string;
  createdByUid: string;
  /** Human name — becomes the audit tag on every contact in this batch. */
  name: string;
  sources: Array<{ provider: ContactSourceProvider; recordCount: number }>;
  contactCount: number;
  duplicatesMerged: number;
  communityIds: string[];
}

export type CreateImportResult =
  | { ok: true; importId: string; created: true }
  | { ok: true; importId: string; created: false; reason: 'idempotent_replay' }
  | { ok: false; reason: 'invalid_name' | 'empty_workspace' };

/**
 * Create (or return existing) ImportBatch.
 *
 * Implementation note: we look up by idempotencyKey to enforce uniqueness
 * within the workspace. The Firestore docId is a fresh generated id; the
 * idempotencyKey is just an indexed field. This way, deletes are still
 * possible if you ever need to redact an import without re-using its name.
 */
export async function createImport(
  input: CreateImportInput
): Promise<CreateImportResult> {
  const name = (input.name || '').trim();
  if (!name) return { ok: false, reason: 'invalid_name' };
  if (!input.workspaceId) return { ok: false, reason: 'empty_workspace' };

  const idempotencyKey = idempotencyKeyFor(input.workspaceId, name);

  const existing = await db
    .collection(COLLECTIONS.imports)
    .where('workspaceId', '==', input.workspaceId)
    .where('idempotencyKey', '==', idempotencyKey)
    .limit(1)
    .get();
  if (!existing.empty) {
    return {
      ok: true,
      importId: existing.docs[0].id,
      created: false,
      reason: 'idempotent_replay',
    };
  }

  const ref = db.collection(COLLECTIONS.imports).doc();
  const doc: ImportBatch = {
    importId: ref.id,
    workspaceId: input.workspaceId,
    name,
    createdByUid: input.createdByUid,
    createdAt: FieldValue.serverTimestamp(),
    sources: input.sources,
    contactCount: input.contactCount,
    duplicatesMerged: input.duplicatesMerged,
    communityIds: input.communityIds,
    idempotencyKey,
  };
  await ref.set(doc);
  return { ok: true, importId: ref.id, created: true };
}

/**
 * Read an import doc, validating it belongs to the caller's workspace.
 * Use this in any route that surfaces an import id from the URL.
 */
export async function getImport(
  workspaceId: string,
  importId: string
): Promise<ImportBatch | null> {
  const snap = await db.collection(COLLECTIONS.imports).doc(importId).get();
  if (!snap.exists) return null;
  const data = snap.data() as ImportBatch;
  if (data.workspaceId !== workspaceId) return null;
  return data;
}

/**
 * List imports for a workspace, newest first.
 */
export async function listImports(
  workspaceId: string,
  opts: { limit?: number } = {}
): Promise<ImportBatch[]> {
  const limit = Math.min(opts.limit || 50, 200);
  const snap = await db
    .collection(COLLECTIONS.imports)
    .where('workspaceId', '==', workspaceId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map((d) => d.data() as ImportBatch);
}
