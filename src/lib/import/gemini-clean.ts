/**
 * Gemini-powered cleanup for imported contact rows.
 *
 * Real-world CSV/Sheets/Eventbrite exports are messy: SHOUTING NAMES, "john
 * smith ", emojis, placeholder junk ("N/A", "-", "test"), aggregate/footer
 * rows ("Total", "Grand total"), and malformed emails. This module normalizes
 * names + emails and flags non-contact rows so they don't pollute the audience.
 *
 * Server-only (reads GEMINI_API_KEY). Always returns a result of the same
 * length/keys as the input — if the key is missing or a batch fails, it falls
 * back to a deterministic cleaner so an import never hard-blocks on the AI.
 */

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

export interface DirtyRow {
  index: number;
  name?: string;
  email?: string;
  phone?: string;
}

export interface CleanRow {
  index: number;
  name: string;
  email: string;
  drop: boolean;
  reason?: string;
}

const MODEL = 'gemini-2.5-flash';
const BATCH = 80;
// Bound AI cost/latency: clean at most this many rows with Gemini; the rest get
// the deterministic cleaner. (Logged by the caller so truncation isn't silent.)
const MAX_GEMINI_ROWS = 3000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_JUNK = new Set([
  'n/a', 'na', 'none', 'null', 'unknown', 'test', 'tbd', '-', '--', '.', 'x',
  'total', 'totals', 'grand total', 'subtotal', 'sum', 'name', 'full name',
]);

/** Deterministic cleaner — used as fallback and for rows past the Gemini cap. */
export function deterministicClean(row: DirtyRow): CleanRow {
  const email = (row.email || '').trim().toLowerCase();
  const cleanEmail = EMAIL_RE.test(email) ? email : '';

  let name = (row.name || '').replace(/\s+/g, ' ').trim();
  // Strip wrapping quotes/punctuation noise.
  name = name.replace(/^["'`.\-\s]+|["'`.\-\s]+$/g, '');
  const lower = name.toLowerCase();
  if (NAME_JUNK.has(lower)) name = '';
  // Title-case all-caps or all-lower single-script names (leave mixed alone).
  if (name && (name === name.toUpperCase() || name === name.toLowerCase())) {
    name = name
      .split(' ')
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
      .join(' ');
  }

  const hasPhone = !!(row.phone && row.phone.trim());
  // Drop only when there's no usable identity at all, or the name is an
  // obvious aggregate label and there's no email/phone behind it.
  const drop = !name && !cleanEmail && !hasPhone;

  return { index: row.index, name, email: cleanEmail, drop };
}

function buildPrompt(rows: DirtyRow[]): string {
  return [
    'You clean rows of an imported CONTACT LIST. For each row return:',
    '- cleanName: the person\'s name in proper Title Case, trimmed, with emojis',
    '  and stray punctuation removed. If the value is a placeholder ("N/A",',
    '  "unknown", "-", "test") or not a real personal name, return "".',
    '- cleanEmail: the email lowercased and trimmed; "" if it is not a valid email.',
    '- drop: true ONLY if the row is clearly NOT a real contact — e.g. an',
    '  aggregate/footer row ("Total", "Grand total"), a repeated header row, or a',
    '  test/junk entry with no real person behind it. When unsure, drop=false.',
    '- reason: a few words if drop=true, else omit.',
    '',
    'Never invent data. Preserve real names/emails. Match each output to its input',
    'by the "index" field.',
    '',
    `ROWS: ${JSON.stringify(rows)}`,
  ].join('\n');
}

async function cleanBatchWithGemini(
  model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>,
  rows: DirtyRow[]
): Promise<CleanRow[]> {
  const res = await model.generateContent(buildPrompt(rows));
  const parsed = JSON.parse(res.response.text()) as Array<{
    index: number;
    cleanName?: string;
    cleanEmail?: string;
    drop?: boolean;
    reason?: string;
  }>;
  const byIndex = new Map(parsed.map((p) => [p.index, p]));

  // Map back over the INPUT so the output always covers every row, even if the
  // model omitted one. Missing rows fall back to deterministic cleaning.
  return rows.map((row) => {
    const p = byIndex.get(row.index);
    if (!p) return deterministicClean(row);
    const email = (p.cleanEmail ?? '').trim().toLowerCase();
    return {
      index: row.index,
      name: (p.cleanName ?? '').trim(),
      email: EMAIL_RE.test(email) ? email : '',
      drop: !!p.drop,
      reason: p.reason,
    };
  });
}

/**
 * Clean a list of rows. Always resolves with one CleanRow per input row.
 */
export async function cleanRowsWithGemini(rows: DirtyRow[]): Promise<CleanRow[]> {
  if (rows.length === 0) return [];

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return rows.map(deterministicClean);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      temperature: 0,
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            index: { type: SchemaType.NUMBER },
            cleanName: { type: SchemaType.STRING },
            cleanEmail: { type: SchemaType.STRING },
            drop: { type: SchemaType.BOOLEAN },
            reason: { type: SchemaType.STRING },
          },
          required: ['index', 'drop'],
        },
      },
    },
  });

  const out: CleanRow[] = [];
  const geminiRows = rows.slice(0, MAX_GEMINI_ROWS);
  const overflow = rows.slice(MAX_GEMINI_ROWS);

  for (let i = 0; i < geminiRows.length; i += BATCH) {
    const batch = geminiRows.slice(i, i + BATCH);
    try {
      out.push(...(await cleanBatchWithGemini(model, batch)));
    } catch (e) {
      console.warn('[gemini-clean] batch failed, using deterministic fallback:', e);
      out.push(...batch.map(deterministicClean));
    }
  }
  // Rows past the cap: deterministic only (cheap, no AI call).
  out.push(...overflow.map(deterministicClean));

  return out;
}
