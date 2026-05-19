/**
 * Client-side import pipeline — CSV / XLSX / Eventbrite attendees / GSheets
 * all funnel through here to produce a uniform `ImportRow[]` that the
 * Preview screen consumes.
 *
 * Two deterministic pre-selection rules (no fuzzy detection):
 *   1. row has neither email nor phone → deselected
 *   2. row dedup-keys to an earlier row → deselected (first occurrence wins)
 *
 * Country grouping uses libphonenumber-js — top ~5 groups become the
 * filter rows the Preview screen renders on the left panel.
 */

import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

/** One uniform row across all import sources. */
export interface ImportRow {
  /** Stable per-import id (random). Used as React key + selection state. */
  id: string;
  /** Original position in the source file (1-indexed); shown in the # column. */
  index: number;
  name: string;
  email: string;
  phone: string;
  /** Phone normalized to E.164, or '' if it couldn't be parsed. */
  phoneE164: string;
  /** ISO-2 country derived from phone; or '' if not parseable. */
  country: string;
  /**
   * Reason this row was auto-deselected, if any.
   *   - empty:     no email AND no phone
   *   - duplicate: dedup-key matches an earlier row in this file
   *   - existing:  dedup-key matches an existing community member
   */
  deselectedReason?: 'empty' | 'duplicate' | 'existing';
  /** Current selection state (mutable; UI flips this). */
  selected: boolean;
}

export interface ParseResult {
  rows: ImportRow[];
  /** Header strings detected (empty for sources without headers). */
  headers: string[];
  /** Country code → count of rows. Top 5 become filter rows in the UI. */
  countryGroups: Array<{ country: string; count: number }>;
  /** Aggregate auto-deselect stats. */
  autoDeselected: {
    empty: number;
    duplicates: number;
    /** Rows whose dedup key matches an existing community member. */
    existing: number;
    total: number;
  };
  /** Total rows parsed (before any UI filtering). */
  totalRows: number;
  /** Total rows currently selected (rows.filter(selected).length cached). */
  selectedCount: number;
}

/* -------------------------------------------------------------------------- */
/*  Delimiter sniffing (CSV)                                                  */
/* -------------------------------------------------------------------------- */

const SUPPORTED_DELIMITERS: Array<',' | '\t' | ';' | '|'> = [',', '\t', ';', '|'];

export function detectDelimiter(text: string): ',' | '\t' | ';' | '|' {
  const lines = text.split(/\r?\n/).filter((l) => l.trim()).slice(0, 5);
  if (lines.length === 0) return ',';
  let best: { d: ',' | '\t' | ';' | '|'; score: number } = { d: ',', score: -1 };
  for (const d of SUPPORTED_DELIMITERS) {
    const pattern = d === '|' ? '\\|' : d === '\t' ? '\\t' : d;
    const counts = lines.map((l) => (l.match(new RegExp(pattern, 'g')) || []).length);
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    if (avg < 1) continue;
    const variance = counts.reduce((a, c) => a + (c - avg) ** 2, 0) / counts.length;
    const score = avg - variance;
    if (score > best.score) best = { d, score };
  }
  return best.d;
}

/** Quote-aware CSV row split. */
function splitCsvRow(line: string, delimiter: string): string[] {
  const cols: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      // Doubled quote inside quotes = literal "
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      cols.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  cols.push(cur.trim());
  return cols;
}

/* -------------------------------------------------------------------------- */
/*  Cell sanitization (CSV-injection mitigation)                              */
/* -------------------------------------------------------------------------- */

/**
 * Excel/Numbers treats =, +, -, @, and leading tab as formula starters,
 * so a row like `=cmd|'/c calc'!A1` becomes a remote-code-exec vector when
 * the host re-exports a CSV from Kyozo. Prefix neutralizes execution.
 */
export function sanitizeCell(s: string): string {
  if (!s) return '';
  if (/^[=+\-@\t]/.test(s)) return `'${s}`;
  return s;
}

/* -------------------------------------------------------------------------- */
/*  Field mapping (header → canonical field)                                  */
/* -------------------------------------------------------------------------- */

/**
 * Recognized header names → canonical field. Case-insensitive substring
 * match. Order matters: the first matching header wins.
 */
const HEADER_MAP: Array<{ field: 'name' | 'email' | 'phone'; patterns: RegExp[] }> = [
  {
    field: 'email',
    patterns: [/^e-?mail$/i, /e-?mail.*address/i, /^email/i],
  },
  {
    field: 'phone',
    patterns: [/^phone/i, /^mobile/i, /^cell/i, /telephone/i, /^tel\b/i, /^wa[\s_-]?id$/i, /^whatsapp/i],
  },
  {
    field: 'name',
    patterns: [/^(full[\s_-]?)?name$/i, /^display[\s_-]?name$/i, /^contact[\s_-]?name$/i],
  },
];

interface ColumnIndex {
  name?: number;
  email?: number;
  phone?: number;
  firstName?: number;
  lastName?: number;
}

function mapHeaders(headers: string[]): ColumnIndex {
  const idx: ColumnIndex = {};
  headers.forEach((h, i) => {
    const trimmed = h.trim();
    // First / last name handled separately since we may need to join them
    if (/^first[\s_-]?name$/i.test(trimmed)) {
      idx.firstName = i;
      return;
    }
    if (/^last[\s_-]?name$/i.test(trimmed) || /^surname$/i.test(trimmed)) {
      idx.lastName = i;
      return;
    }
    for (const entry of HEADER_MAP) {
      if (idx[entry.field] !== undefined) continue;
      if (entry.patterns.some((re) => re.test(trimmed))) {
        idx[entry.field] = i;
        return;
      }
    }
  });
  return idx;
}

/* -------------------------------------------------------------------------- */
/*  Build canonical rows from a 2D grid                                       */
/* -------------------------------------------------------------------------- */

interface BuildRowsInput {
  headerRow: string[];
  dataRows: string[][];
  defaultCountry?: CountryCode;
}

function buildRows({ headerRow, dataRows, defaultCountry }: BuildRowsInput): ImportRow[] {
  const idx = mapHeaders(headerRow);
  const out: ImportRow[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const cells = dataRows[i].map(sanitizeCell);

    let name = '';
    if (idx.name !== undefined) name = cells[idx.name] || '';
    if (!name && (idx.firstName !== undefined || idx.lastName !== undefined)) {
      name = [cells[idx.firstName ?? -1], cells[idx.lastName ?? -1]]
        .filter(Boolean)
        .join(' ');
    }

    const email = idx.email !== undefined ? (cells[idx.email] || '').toLowerCase().trim() : '';
    const rawPhone = idx.phone !== undefined ? cells[idx.phone] : '';
    const { phoneE164, country } = normalizePhone(rawPhone, defaultCountry);

    out.push({
      id: `row-${i}-${Math.random().toString(36).slice(2, 8)}`,
      index: i + 1,
      name,
      email,
      phone: rawPhone,
      phoneE164,
      country,
      selected: true, // pre-selection rules applied in applyPreSelection()
    });
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/*  Phone normalization                                                       */
/* -------------------------------------------------------------------------- */

function normalizePhone(
  raw: string,
  defaultCountry?: CountryCode
): { phoneE164: string; country: string } {
  if (!raw) return { phoneE164: '', country: '' };
  try {
    const parsed = parsePhoneNumberFromString(raw, defaultCountry);
    if (parsed && parsed.isValid()) {
      return { phoneE164: parsed.number, country: parsed.country || '' };
    }
  } catch {
    // fall through
  }
  return { phoneE164: '', country: '' };
}

/* -------------------------------------------------------------------------- */
/*  Pre-selection (the two deterministic rules)                               */
/* -------------------------------------------------------------------------- */

function applyPreSelection(rows: ImportRow[]): {
  empty: number;
  duplicates: number;
} {
  let empty = 0;
  let duplicates = 0;
  const seen = new Set<string>();

  for (const r of rows) {
    // Rule 1: no contact info
    if (!r.email && !r.phoneE164) {
      r.selected = false;
      r.deselectedReason = 'empty';
      empty += 1;
      continue;
    }
    // Rule 2: duplicates by dedup key (phone wins, email fallback)
    const key = r.phoneE164 ? `p:${r.phoneE164}` : `e:${r.email}`;
    if (seen.has(key)) {
      r.selected = false;
      r.deselectedReason = 'duplicate';
      duplicates += 1;
      continue;
    }
    seen.add(key);
  }
  return { empty, duplicates };
}

/* -------------------------------------------------------------------------- */
/*  Country grouping                                                          */
/* -------------------------------------------------------------------------- */

function groupByCountry(rows: ImportRow[]): Array<{ country: string; count: number }> {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const c = r.country || 'unknown';
    counts.set(c, (counts.get(c) || 0) + 1);
  }
  return [...counts.entries()]
    .filter(([country]) => country !== 'unknown')
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

/* -------------------------------------------------------------------------- */
/*  Public entry points                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Parse a CSV/TSV string.
 */
export function parseCsv(
  text: string,
  opts: { defaultCountry?: CountryCode; delimiter?: ',' | '\t' | ';' | '|' } = {}
): ParseResult {
  const delimiter = opts.delimiter || detectDelimiter(text);
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) {
    return emptyResult();
  }
  const grid = lines.map((l) => splitCsvRow(l, delimiter));
  const [headerRow, ...dataRows] = grid;
  const rows = buildRows({ headerRow, dataRows, defaultCountry: opts.defaultCountry });
  return finalize(rows, headerRow);
}

/**
 * Parse rows that have already been turned into a 2D array (e.g. xlsx
 * via SheetJS, or Eventbrite attendees we shape into [name, email, phone]).
 */
export function parseGrid(
  grid: string[][],
  opts: { defaultCountry?: CountryCode; hasHeader?: boolean } = {}
): ParseResult {
  if (grid.length === 0) return emptyResult();
  const hasHeader = opts.hasHeader ?? true;
  const headerRow = hasHeader ? grid[0] : ['name', 'email', 'phone'];
  const dataRows = hasHeader ? grid.slice(1) : grid;
  const rows = buildRows({ headerRow, dataRows, defaultCountry: opts.defaultCountry });
  return finalize(rows, headerRow);
}

function emptyResult(): ParseResult {
  return {
    rows: [],
    headers: [],
    countryGroups: [],
    autoDeselected: { empty: 0, duplicates: 0, existing: 0, total: 0 },
    totalRows: 0,
    selectedCount: 0,
  };
}

function finalize(rows: ImportRow[], headerRow: string[]): ParseResult {
  const ds = applyPreSelection(rows);
  const countryGroups = groupByCountry(rows);
  const selectedCount = rows.filter((r) => r.selected).length;
  return {
    rows,
    headers: headerRow,
    countryGroups,
    autoDeselected: {
      empty: ds.empty,
      duplicates: ds.duplicates,
      existing: 0, // populated later by markExistingMembers()
      total: ds.empty + ds.duplicates,
    },
    totalRows: rows.length,
    selectedCount,
  };
}

/**
 * Cross-import dedup: given a set of dedup keys for existing community members,
 * mark matching rows as auto-deselected with reason 'existing'. Returns the
 * updated ParseResult so the dialog can swap state in one go.
 *
 * Each row's dedup key is reconstructed inline (we don't store it on ImportRow
 * because the prefix logic lives in the server too). Phone wins over email,
 * matching the rule in computeDedupKey on the server.
 */
export function markExistingMembers(
  result: ParseResult,
  existingKeys: Set<string>
): ParseResult {
  if (existingKeys.size === 0) return result;

  let existing = 0;
  const rows = result.rows.map((r) => {
    // Already deselected for another reason — leave it.
    if (r.deselectedReason) return r;
    const key = r.phoneE164
      ? `p:${r.phoneE164}`
      : r.email
        ? `e:${r.email}`
        : null;
    if (key && existingKeys.has(key)) {
      existing += 1;
      return { ...r, selected: false, deselectedReason: 'existing' as const };
    }
    return r;
  });

  const selectedCount = rows.filter((r) => r.selected).length;
  return {
    ...result,
    rows,
    selectedCount,
    autoDeselected: {
      ...result.autoDeselected,
      existing,
      total: result.autoDeselected.empty + result.autoDeselected.duplicates + existing,
    },
  };
}
