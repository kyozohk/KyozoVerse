/**
 * POST /api/v1/import/clean
 *
 * Cleans parsed import rows with Gemini before they're written: normalizes
 * names + emails and flags junk / non-contact rows. Used by ImportMembersDialog
 * during the Preview step so the user reviews (and imports) clean data.
 *
 * Request (JSON): { rows: [{ index, name?, email?, phone? }] }
 * Response (200): { cleaned: [{ index, name, email, drop, reason? }] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api-auth';
import { cleanRowsWithGemini, type DirtyRow } from '@/lib/import/gemini-clean';

const MAX_ROWS = 20000;

export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (authResult.error) return authResult.error;

  let body: { rows?: DirtyRow[] };
  try {
    body = (await request.json()) as { rows?: DirtyRow[] };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body', code: 'BAD_REQUEST' }, { status: 400 });
  }

  if (!Array.isArray(body.rows)) {
    return NextResponse.json({ error: 'rows must be an array', code: 'MISSING_FIELD' }, { status: 400 });
  }
  if (body.rows.length === 0) {
    return NextResponse.json({ cleaned: [] });
  }
  if (body.rows.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Too many rows. Cap is ${MAX_ROWS}.`, code: 'PAYLOAD_TOO_LARGE' },
      { status: 413 }
    );
  }

  // Keep only the fields we need (defensive against oversized payloads).
  const rows: DirtyRow[] = body.rows.map((r) => ({
    index: Number(r.index),
    name: typeof r.name === 'string' ? r.name : undefined,
    email: typeof r.email === 'string' ? r.email : undefined,
    phone: typeof r.phone === 'string' ? r.phone : undefined,
  }));

  try {
    const cleaned = await cleanRowsWithGemini(rows);
    return NextResponse.json({ cleaned });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, code: 'CLEAN_FAILED' }, { status: 500 });
  }
}
