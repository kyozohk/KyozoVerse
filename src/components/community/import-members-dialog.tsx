'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle, VisuallyHidden } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Calendar, Upload, Plus, X, ChevronLeft, Check,
  FileSpreadsheet, FileText, AlertCircle, Loader2,
  Download, Trash2, Edit2, Save, Zap, Users,
} from 'lucide-react';
import { type Community } from '@/lib/types';
import { addDoc, collection, serverTimestamp, increment, updateDoc, doc, query, where, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { communityAuth } from '@/firebase/community-auth';
import { useToast } from '@/hooks/use-toast';

// --- Validation constants shared across manual entry, CSV preview, and import ---
// KYPRO-66 / KYPRO-67: cap lengths so we don't persist 500-char names/emails
// that later blow up the preview table and profile card layouts.
const MAX_NAME_LEN  = 100;           // KYPRO-66
const MAX_EMAIL_LEN = 254;           // KYPRO-66 (RFC 5321)
const MAX_PHONE_LEN = 20;            // KYPRO-64
const MAX_TAG_LEN   = 40;
// KYPRO-74: bulk import perf. We parallelize rows and batch Firestore writes.
const IMPORT_CONCURRENCY    = 8;     // concurrent row workers
const FIRESTORE_BATCH_SIZE  = 400;   // Firestore limit is 500 writes / batch
// Accepted delimiters when we sniff a CSV. KYPRO-30.
const SUPPORTED_DELIMITERS: Array<',' | '\t' | ';' | '|'> = [',', '\t', ';', '|'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ImportSource = 'eventbrite' | 'csv' | 'xlsx' | 'manual';
type DialogStep = 'sources' | 'configure' | 'preview' | 'importing';

interface ImportMember {
  _id: string; name: string; email: string; phone: string; tags: string; notes: string;
  [key: string]: string;
}
interface SourceDone { count: number; errors: number; }

interface ImportMembersDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  community: Community;
  onSuccess: () => void;
}

function parseDelimitedFile(text: string, delimiter: string = ','): string[][] {
  const rows: string[][] = [];
  for (const line of text.split(/\r?\n/).filter(l => l.trim())) {
    const cols: string[] = []; let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; } 
      else if (ch === delimiter && !inQ) { cols.push(cur.trim()); cur = ''; } 
      else { cur += ch; }
    }
    cols.push(cur.trim()); rows.push(cols);
  }
  return rows;
}

// KYPRO-30 / KYPRO-62: robust delimiter sniffing that supports , \t ; | and picks
// the one that yields the most consistent column counts across the first few lines.
function detectDelimiter(text: string): ',' | '\t' | ';' | '|' {
  const lines = text.split(/\r?\n/).filter(l => l.trim()).slice(0, 5);
  let best: { d: ',' | '\t' | ';' | '|'; score: number } = { d: ',', score: -1 };
  for (const d of SUPPORTED_DELIMITERS) {
    const counts = lines.map(l => (l.match(new RegExp(d === '|' ? '\\|' : d === '\t' ? '\\t' : d, 'g')) || []).length);
    const avg = counts.reduce((a, b) => a + b, 0) / (counts.length || 1);
    if (avg < 1) continue;
    // Prefer delimiters whose counts are consistent across rows.
    const variance = counts.reduce((a, c) => a + (c - avg) ** 2, 0) / (counts.length || 1);
    const score = avg - variance;
    if (score > best.score) best = { d, score };
  }
  console.log('[KYPRO-30][detectDelimiter]', JSON.stringify({ picked: best.d, score: best.score }));
  return best.d;
}

interface HeaderValidation {
  valid: boolean;
  error?: string;
  warnings?: string[];
  hasName: boolean;
  hasEmail: boolean;
}

// KYPRO-27 / KYPRO-29 / KYPRO-32: header validation is now strict.
// - Requires BOTH name AND email (was: either).
// - Rejects files whose "header" row looks like actual data (e.g. first-row-as-data xlsx).
// - Returns list of unrecognized columns as warnings, not silent drops.
function validateHeaders(headers: string[]): HeaderValidation {
  const normalized = headers.map(h => (h || '').toLowerCase().replace(/[^a-z0-9]/g, '_'));
  const hasName  = normalized.some(h => h.includes('name') || h.includes('first'));
  const hasEmail = normalized.some(h => h.includes('email'));

  // KYPRO-32: detect "first row is data" — values that contain digits or @ sign
  // are almost certainly data, not headers.
  const looksLikeData = headers.some(h => EMAIL_RE.test(h || '') || /\d/.test(h || ''));
  if (looksLikeData) {
    return {
      valid: false, hasName, hasEmail,
      error: 'The first row looks like data, not headers. Please include a header row with at least "name" and "email" columns.',
    };
  }

  if (!hasName || !hasEmail) {
    const missing = [!hasName && 'name', !hasEmail && 'email'].filter(Boolean).join(' and ');
    return {
      valid: false, hasName, hasEmail,
      error: `File is missing required column${missing.includes('and') ? 's' : ''}: ${missing}.`,
    };
  }

  const warnings: string[] = [];
  const recognizedPatterns = ['name', 'first', 'last', 'email', 'phone', 'mobile', 'tag', 'note', 'comment'];
  const unrecognized = headers.filter((h, i) => {
    const norm = normalized[i];
    return norm && !recognizedPatterns.some(p => norm.includes(p));
  });
  if (unrecognized.length > 0) {
    warnings.push(`Unrecognized columns will be ignored: ${unrecognized.join(', ')}`);
  }
  return { valid: true, hasName, hasEmail, warnings };
}

// KYPRO-66 / KYPRO-67: clip long values while reading rows so downstream UI
// (preview table, profile card) cannot overflow.
function clip(val: string, max: number) {
  if (!val) return '';
  return val.length > max ? val.slice(0, max) : val;
}

function rowsToMembers(rows: string[][]): ImportMember[] {
  if (rows.length < 2) return [];
  const h = rows[0].map(x => (x || '').toLowerCase().replace(/[^a-z0-9]/g, '_'));
  const ni = h.findIndex(x => x.includes('name') || x.includes('first'));
  const ei = h.findIndex(x => x.includes('email'));
  const pi = h.findIndex(x => x.includes('phone') || x.includes('mobile'));
  const ti = h.findIndex(x => x.includes('tag'));
  const oi = h.findIndex(x => x.includes('note') || x.includes('comment'));
  return rows.slice(1).map((r, i) => ({
    _id: `imp-${i}`,
    name:  clip(ni >= 0 ? r[ni] || '' : '', MAX_NAME_LEN),
    email: clip(ei >= 0 ? r[ei] || '' : '', MAX_EMAIL_LEN),
    phone: clip(pi >= 0 ? r[pi] || '' : '', MAX_PHONE_LEN),
    tags:  clip(ti >= 0 ? r[ti] || '' : '', MAX_TAG_LEN * 10),
    notes: clip(oi >= 0 ? r[oi] || '' : '', 500),
  }));
}

// KYPRO-31 / KYPRO-38 / KYPRO-70: de-duplicate incoming rows by (lowercased) email.
// We keep the first occurrence and surface a warning so the user knows some rows
// were dropped — instead of silently double-importing.
function dedupeByEmail(rows: ImportMember[]): { unique: ImportMember[]; duplicates: number } {
  const seen = new Set<string>();
  const unique: ImportMember[] = [];
  let duplicates = 0;
  for (const r of rows) {
    const key = (r.email || '').trim().toLowerCase();
    if (!key) { unique.push(r); continue; }
    if (seen.has(key)) { duplicates++; continue; }
    seen.add(key); unique.push(r);
  }
  return { unique, duplicates };
}

const SOURCES = [
  { id: 'csv' as ImportSource,        label: 'CSV File',    Icon: FileText,        color: '#059669', bg: '#ECFDF5', desc: 'Upload a .csv or .tsv file' },
  { id: 'xlsx' as ImportSource,       label: 'Excel / XLS', Icon: FileSpreadsheet, color: '#1D6F42', bg: '#F0FDF4', desc: 'Upload .xlsx or .xls file' },
  { id: 'eventbrite' as ImportSource, label: 'Eventbrite',  Icon: Calendar,        color: '#E07B39', bg: '#FFF3E8', desc: 'Import event attendees' },
  { id: 'manual' as ImportSource,     label: 'Manual Entry',Icon: Plus,            color: '#7C3AED', bg: '#F5F3FF', desc: 'Add contacts one by one' },
];

export const ImportMembersDialog: React.FC<ImportMembersDialogProps> = ({ isOpen, onOpenChange, community, onSuccess }) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<DialogStep>('sources');
  const [currentSource, setCurrentSource] = useState<ImportSource | null>(null);
  const [doneSources, setDoneSources] = useState<Partial<Record<ImportSource, SourceDone>>>({});
  const [totalImported, setTotalImported] = useState(0);
  const [pendingMembers, setPendingMembers] = useState<ImportMember[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [ebToken, setEbToken] = useState('');
  const [ebEventId, setEbEventId] = useState('');
  const [ebEvents, setEbEvents] = useState<any[]>([]);
  const [ebLoading, setEbLoading] = useState(false);
  const [ebError, setEbError] = useState('');
  const [manualForm, setManualForm] = useState({ name: '', email: '', phone: '', tags: '' });
  const [importProgress, setImportProgress] = useState(0);

  // ── Helpers ────────────────────────────────────────────────
  const handleClose = (open: boolean) => {
    if (!open) {
      setStep('sources'); setCurrentSource(null); setPendingMembers([]);
      setDoneSources({}); setTotalImported(0); setEbToken(''); setEbEventId(''); setEbEvents([]);
      setEbError(''); setManualForm({ name: '', email: '', phone: '', tags: '' });
      setImportProgress(0);
    }
    onOpenChange(open);
  };

  // KYPRO-27/29/30/31/32/62/28: unified file handling with strict validation,
  // dedup, and detailed logs for both CSV/TSV and XLSX paths.
  const handleFileUpload = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    console.log('[KYPRO-import][upload] start', JSON.stringify({ name: file.name, ext, size: file.size }));
    try {
      let rows: string[][] = [];
      if (ext === 'csv' || ext === 'tsv') {
        const text = await file.text();
        // KYPRO-62: TSV files always use tab, never autodetect (files often have commas inside cells).
        const delimiter = ext === 'tsv' ? '\t' : detectDelimiter(text);
        rows = parseDelimitedFile(text, delimiter);
        console.log('[KYPRO-import][upload] parsed', JSON.stringify({ ext, delimiter: delimiter === '\t' ? 'TAB' : delimiter, rowCount: rows.length, firstRowCols: rows[0]?.length }));
      } else if (ext === 'xlsx' || ext === 'xls') {
        const XLSX = await import('xlsx');
        const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
        rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' }) as string[][];
        console.log('[KYPRO-import][upload] xlsx parsed', JSON.stringify({ sheetName: wb.SheetNames[0], rowCount: rows.length }));
      } else {
        toast({ title: 'Unsupported file', description: 'Please upload a .csv, .tsv, .xlsx or .xls file.', variant: 'destructive' });
        return;
      }

      if (rows.length < 2) {
        toast({ title: 'Empty file', description: 'File must contain a header row and at least one data row.', variant: 'destructive' });
        return;
      }

      // KYPRO-27 / 29 / 32: require a valid header row with both name+email.
      const validation = validateHeaders(rows[0]);
      if (!validation.valid) {
        console.warn('[KYPRO-import][upload] header_invalid', JSON.stringify({ error: validation.error, header: rows[0] }));
        toast({ title: 'Invalid file', description: validation.error, variant: 'destructive' });
        return;
      }
      if (validation.warnings?.length) {
        toast({ title: 'Heads up', description: validation.warnings.join(' '), variant: 'default' });
      }

      // KYPRO-66/67: clip + KYPRO-31/38: dedupe by email.
      const parsed = rowsToMembers(rows);
      const { unique, duplicates } = dedupeByEmail(parsed);
      console.log('[KYPRO-import][upload] parsed_members', JSON.stringify({ parsed: parsed.length, unique: unique.length, duplicates }));
      if (duplicates > 0) {
        toast({
          title: `${duplicates} duplicate${duplicates === 1 ? '' : 's'} removed`,
          description: `We detected ${duplicates} row${duplicates === 1 ? '' : 's'} with the same email and kept only the first occurrence.`,
        });
      }
      setPendingMembers(unique);
      setStep('preview');
    } catch (e: any) {
      // KYPRO-28: surface xlsx parse errors instead of swallowing them.
      console.error('[KYPRO-import][upload] parse_error', JSON.stringify({ ext, message: e?.message, name: e?.name }));
      toast({ title: 'Could not parse file', description: e?.message || 'Unknown parse error.', variant: 'destructive' });
    }
  }, [toast]);

  const fetchEbEvents = async () => {
    if (!ebToken) return;
    setEbLoading(true); setEbError('');
    try {
      const res = await fetch('/api/eventbrite/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: ebToken }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch events');
      setEbEvents(data.events || []);
    } catch (e: any) { setEbError(e.message || 'Failed to fetch events'); }
    finally { setEbLoading(false); }
  };

  const fetchEbAttendees = async () => {
    if (!ebToken || !ebEventId) return;
    setEbLoading(true); setEbError('');
    try {
      const res = await fetch('/api/eventbrite/attendees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: ebToken, eventId: ebEventId }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      // KYPRO-70: Eventbrite returns one attendee row per ticket type. De-duplicate
      // by email so a single person with 2 ticket types doesn't become 2 members.
      const mapped = (data.attendees || []).map((a: any, i: number) => ({
        _id: `eb-${i}`,
        name: clip(`${a.profile?.first_name || ''} ${a.profile?.last_name || ''}`.trim(), MAX_NAME_LEN),
        email: clip(a.profile?.email || '', MAX_EMAIL_LEN),
        phone: clip(a.profile?.cell_phone || '', MAX_PHONE_LEN),
        tags: 'eventbrite',
        notes: clip(a.ticket_class_name || '', 500),
      })) as ImportMember[];
      const { unique, duplicates } = dedupeByEmail(mapped);
      console.log('[KYPRO-70][eventbrite] attendees', JSON.stringify({ raw: mapped.length, unique: unique.length, duplicates }));
      if (duplicates > 0) {
        toast({
          title: `${duplicates} duplicate attendee${duplicates === 1 ? '' : 's'} merged`,
          description: `Eventbrite returned the same attendee across multiple ticket types. We kept one copy per email.`,
        });
      }
      setPendingMembers(unique);
      setStep('preview');
    } catch (e: any) { setEbError(e.message || 'Failed'); }
    finally { setEbLoading(false); }
  };

  const addManualMember = () => {
    // KYPRO-33 / KYPRO-34: require BOTH a name AND an email. Previously we accepted
    // "at least one of the two" which let blank rows slip through.
    const name  = (manualForm.name || '').trim();
    const email = (manualForm.email || '').trim();
    const phone = (manualForm.phone || '').trim();
    const tags  = (manualForm.tags  || '').trim();

    if (!name) {
      toast({ title: 'Name required', description: 'Please enter a name.', variant: 'destructive' });
      return;
    }
    if (!email) {
      toast({ title: 'Email required', description: 'Email is now required for all members.', variant: 'destructive' });
      return;
    }
    // KYPRO-26 / KYPRO-37: enforce email format always (not just "if provided").
    if (!EMAIL_RE.test(email)) {
      toast({ title: 'Invalid Email', description: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }
    // KYPRO-66: enforce length limits.
    if (name.length > MAX_NAME_LEN) {
      toast({ title: 'Name too long', description: `Names are limited to ${MAX_NAME_LEN} characters.`, variant: 'destructive' });
      return;
    }
    if (email.length > MAX_EMAIL_LEN) {
      toast({ title: 'Email too long', description: `Emails are limited to ${MAX_EMAIL_LEN} characters.`, variant: 'destructive' });
      return;
    }
    // KYPRO-64: phone must be digits / + / spaces / hyphens / parens only.
    if (phone && !/^[0-9+\-\s()]+$/.test(phone)) {
      toast({ title: 'Invalid phone', description: 'Phone may only contain digits, spaces, + - and parentheses.', variant: 'destructive' });
      return;
    }

    // KYPRO-38: reject duplicates against rows already in the preview.
    const existingEmail = pendingMembers.find(m => (m.email || '').trim().toLowerCase() === email.toLowerCase());
    if (existingEmail) {
      toast({ title: 'Duplicate contact', description: `${email} is already in this import.`, variant: 'destructive' });
      return;
    }

    console.log('[KYPRO-34][manual] add', JSON.stringify({ name, email, phone, tags }));
    setPendingMembers(p => [...p, {
      _id: `m-${Date.now()}`,
      name: clip(name, MAX_NAME_LEN),
      email: clip(email, MAX_EMAIL_LEN),
      phone: clip(phone, MAX_PHONE_LEN),
      tags: clip(tags, MAX_TAG_LEN * 10),
      notes: '',
    }]);
    setManualForm({ name: '', email: '', phone: '', tags: '' });
  };

  // KYPRO-74: bulk import performance.
  //
  // Previous implementation did 4 sequential round-trips per row (users-query,
  // auth-create, user-write, member-write) in a for/await loop — ~1-2s per row,
  // ~17min for 1001 rows.
  //
  // Fixes applied here:
  //  1. Pre-query existing users by email in ONE chunked `in` query instead of 1 query/row.
  //  2. Run row workers with bounded concurrency (IMPORT_CONCURRENCY).
  //  3. Replace addDoc/setDoc loops with Firestore writeBatch (up to 500 writes).
  //  4. Still handle per-row errors gracefully and keep the progress bar responsive.
  const runImport = async () => {
    if (!community?.communityId || pendingMembers.length === 0) return;
    const t0 = performance.now();
    console.log('[KYPRO-74][import] start', JSON.stringify({ total: pendingMembers.length, source: currentSource }));
    setStep('importing'); setImportProgress(0);

    // 1. Pre-fetch existing user docs by email, in chunks of 10 (Firestore `in` limit).
    const emails = Array.from(new Set(
      pendingMembers.map(m => (m.email || '').trim().toLowerCase()).filter(Boolean)
    ));
    const existingByEmail = new Map<string, string>(); // email -> userId
    for (let i = 0; i < emails.length; i += 10) {
      const chunk = emails.slice(i, i + 10);
      try {
        const snap = await getDocs(query(collection(db, 'users'), where('email', 'in', chunk)));
        snap.forEach(d => {
          const e = ((d.data() as any).email || '').toLowerCase();
          if (e) existingByEmail.set(e, d.id);
        });
      } catch (e: any) {
        // Fallback: per-email query chunk if composite index missing.
        console.warn('[KYPRO-74][import] bulk_email_query_failed_fallback', JSON.stringify({ chunk, message: e?.message }));
        for (const em of chunk) {
          try {
            const s = await getDocs(query(collection(db, 'users'), where('email', '==', em)));
            if (!s.empty) existingByEmail.set(em, s.docs[0].id);
          } catch {/* ignore */}
        }
      }
    }
    console.log('[KYPRO-74][import] existing_users_found', JSON.stringify({ emails: emails.length, matched: existingByEmail.size }));

    // 2. Prepare per-row work. Auth create MUST still be serialised (Firebase SDK
    //    mutates the app's auth session), but we keep concurrency on the Firestore
    //    writes and user lookup.
    interface PreparedRow { m: ImportMember; userId: string; ph: string; needsAuth: boolean; }
    const prepared: PreparedRow[] = pendingMembers.map((m, i) => {
      let ph = m.phone?.trim().replace(/\s+/g, '') || '';
      if (ph && !ph.startsWith('+')) ph = '+' + ph;
      const emailKey = (m.email || '').trim().toLowerCase();
      const existingId = emailKey ? existingByEmail.get(emailKey) : null;
      if (existingId) return { m, userId: existingId, ph, needsAuth: false };
      // Deterministic fallback id so retries don't duplicate.
      const fallbackId = `imported-${Date.now()}-${i}`;
      return { m, userId: fallbackId, ph, needsAuth: !!(emailKey && emailKey.includes('@')) };
    });

    // 3. Run Firebase Auth creates in a small concurrency pool. We tolerate failures
    //    (e.g. email-already-in-use means the user exists elsewhere — fall back to
    //    the fallback id and still create the membership record).
    let successCount = 0;
    const errors: string[] = [];
    let done = 0;
    const bumpProgress = () => {
      done++;
      setImportProgress(Math.round((done / prepared.length) * 100));
    };

    // Work queue for auth creation (step 3a) + user doc write (step 3b).
    let cursor = 0;
    const authWorker = async () => {
      while (cursor < prepared.length) {
        const idx = cursor++;
        const row = prepared[idx];
        if (!row.needsAuth) continue;
        try {
          const cred = await createUserWithEmailAndPassword(communityAuth, row.m.email, Math.random().toString(36).slice(-10));
          row.userId = cred.user.uid;
        } catch (e: any) {
          // auth/email-already-in-use etc. — keep fallback id, continue.
          console.warn('[KYPRO-74][import] auth_create_failed', JSON.stringify({ email: row.m.email, code: e?.code, message: e?.message }));
        }
      }
    };
    await Promise.all(Array.from({ length: IMPORT_CONCURRENCY }, authWorker));
    console.log('[KYPRO-74][import] auth_phase_done', JSON.stringify({ ms: Math.round(performance.now() - t0) }));

    // 4. Firestore writeBatch for users + communityMembers. Up to 400 writes per batch.
    //    Each row produces at most 2 writes (user doc + member doc), so we pack
    //    ~200 rows per batch.
    const ROWS_PER_BATCH = Math.floor(FIRESTORE_BATCH_SIZE / 2);
    for (let i = 0; i < prepared.length; i += ROWS_PER_BATCH) {
      const slice = prepared.slice(i, i + ROWS_PER_BATCH);
      const batch = writeBatch(db);
      for (const row of slice) {
        try {
          // Only write the user doc for brand-new users (needsAuth means we tried to create them).
          if (row.needsAuth) {
            batch.set(doc(db, 'users', row.userId), {
              userId: row.userId,
              displayName: row.m.name,
              email: row.m.email,
              phone: row.ph,
              phoneNumber: row.ph,
              wa_id: row.ph.replace(/\+/g, ''),
              createdAt: serverTimestamp(),
            }, { merge: true });
          }
          // Always write the membership.
          const memberRef = doc(collection(db, 'communityMembers'));
          batch.set(memberRef, {
            userId: row.userId,
            communityId: community.communityId,
            role: 'member',
            status: 'active',
            source: 'import',
            importedAt: serverTimestamp(),
            joinedAt: serverTimestamp(),
            tags: row.m.tags ? row.m.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            userDetails: {
              displayName: row.m.name,
              email: row.m.email,
              phone: row.ph,
              avatarUrl: null,
            },
          });
        } catch (e: any) {
          errors.push(`${row.m.email || row.m.name}: ${e?.message || 'unknown'}`);
        }
      }
      try {
        await batch.commit();
        successCount += slice.length;
      } catch (e: any) {
        console.error('[KYPRO-74][import] batch_commit_failed', JSON.stringify({ startIdx: i, size: slice.length, message: e?.message }));
        errors.push(`Batch ${i}-${i + slice.length - 1}: ${e?.message || 'unknown'}`);
      }
      for (let j = 0; j < slice.length; j++) bumpProgress();
    }

    try {
      await updateDoc(doc(db, 'communities', community.communityId), { memberCount: increment(successCount) });
    } catch (_) {}

    const elapsedMs = Math.round(performance.now() - t0);
    console.log('[KYPRO-74][import] done', JSON.stringify({ successCount, errorCount: errors.length, elapsedMs, rowsPerSec: +(prepared.length / (elapsedMs / 1000)).toFixed(2) }));

    setDoneSources(p => ({ ...p, [currentSource!]: { count: successCount, errors: errors.length } }));
    setTotalImported(p => p + successCount);
    onSuccess();
    toast({
      title: 'Import Complete',
      description: `${successCount} of ${pendingMembers.length} members imported${errors.length ? ` (${errors.length} failed)` : ''} in ${(elapsedMs / 1000).toFixed(1)}s.`,
    });
    setTimeout(() => { setStep('sources'); setCurrentSource(null); setPendingMembers([]); setEditingId(null); }, 900);
  };

  const selectSource = (src: ImportSource) => {
    setCurrentSource(src); setPendingMembers([]); setEbError(''); setEbEvents([]);
    setStep(src === 'manual' ? 'preview' : 'configure');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl w-full p-0 gap-0 overflow-hidden [&>button:last-of-type]:hidden" style={{ maxHeight: '90vh' }}>
        <VisuallyHidden>
          <DialogTitle>Import Members</DialogTitle>
        </VisuallyHidden>

        {/* Gradient header */}
        <div className="px-6 py-5 flex items-center justify-between flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Automatically Integrate</h2>
              <p className="text-white/80 text-sm">Consolidate contacts from multiple sources</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {totalImported > 0 && (
              <span className="bg-white/20 text-white text-sm font-semibold px-3 py-1 rounded-full">
                {totalImported} imported
              </span>
            )}
            <button onClick={() => handleClose(false)} className="text-white/70 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>

          {/* ── Sources hub ── */}
          {step === 'sources' && (
            <div className="p-6">
              <p className="text-sm mb-5" style={{ color: '#8B7355' }}>
                Choose a source below. You can import from multiple sources — members accumulate.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {SOURCES.map(({ id, label, Icon, color, bg, desc }) => {
                  const done = doneSources[id];
                  return (
                    <button key={id} onClick={() => selectSource(id)}
                      className="flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all hover:shadow-md hover:-translate-y-0.5"
                      style={{ borderColor: done ? '#10b981' : '#E8DFD1', backgroundColor: done ? '#f0fdf4' : 'white' }}>
                      <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: bg, color }}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm" style={{ color: '#3D2E1E' }}>{label}</p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: '#8B7355' }}>
                          {done ? `${done.count} contacts imported` : desc}
                        </p>
                      </div>
                      <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center ${done ? 'bg-green-500' : 'border-2'}`} style={done ? {} : { borderColor: '#E8DFD1' }}>
                        {done && <Check className="h-3.5 w-3.5 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              {totalImported > 0 && (
                <div className="flex gap-3 pt-4 border-t" style={{ borderColor: '#E8DFD1' }}>
                  <Button variant="outline" className="flex-1" onClick={() => handleClose(false)} style={{ borderColor: '#E8DFD1', color: '#5B4A3A' }}>Close</Button>
                  <Button className="flex-1" onClick={() => handleClose(false)} style={{ backgroundColor: '#5B4A3A', color: 'white' }}>
                    <Users className="h-4 w-4 mr-2" />View {totalImported} Members
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ── Configure: CSV / XLSX ── */}
          {step === 'configure' && (currentSource === 'csv' || currentSource === 'xlsx') && (
            <div className="p-6 space-y-4">
              <button onClick={() => setStep('sources')} className="text-sm flex items-center gap-1 mb-2 hover:underline" style={{ color: '#8B7355' }}>
                <ChevronLeft className="h-4 w-4" />Back to sources
              </button>
              <h3 className="font-semibold" style={{ color: '#3D2E1E' }}>Upload {currentSource === 'csv' ? 'CSV / TSV' : 'Excel'} File</h3>
              <p className="text-sm" style={{ color: '#8B7355' }}>Columns recognised: <strong>Name, Email, Phone, Tags</strong> (header row required)</p>
              <div className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: '#E8DFD1' }} onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-8 w-8 mx-auto mb-2" style={{ color: '#B0A090' }} />
                <p className="text-sm font-medium" style={{ color: '#5B4A3A' }}>Click to browse or drag & drop</p>
                <p className="text-xs mt-1" style={{ color: '#8B7355' }}>{currentSource === 'csv' ? '.csv, .tsv' : '.xlsx, .xls'} accepted</p>
                <input ref={fileInputRef} type="file" accept={currentSource === 'csv' ? '.csv,.tsv' : '.xlsx,.xls'} className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
              </div>
            </div>
          )}

          {/* ── Configure: Eventbrite ── */}
          {step === 'configure' && currentSource === 'eventbrite' && (
            <div className="p-6 space-y-4">
              <button onClick={() => setStep('sources')} className="text-sm flex items-center gap-1 mb-2 hover:underline" style={{ color: '#8B7355' }}>
                <ChevronLeft className="h-4 w-4" />Back to sources
              </button>
              <h3 className="font-semibold" style={{ color: '#3D2E1E' }}>Connect Eventbrite</h3>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: '#8B7355' }}>Private API Token</label>
                <input value={ebToken} onChange={e => setEbToken(e.target.value)} placeholder="Paste your Eventbrite private token…"
                  className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none" style={{ borderColor: '#E8DFD1' }} />
                <p className="text-xs mt-1" style={{ color: '#B0A090' }}>Eventbrite → Account Settings → Developer Links → API Keys</p>
              </div>
              {ebEvents.length === 0 ? (
                // KYPRO-72: removed the redundant 'Back' button — users already have the
                // '← Back to sources' breadcrumb link at the top of this screen.
                <div className="flex gap-3 pt-2">
                  <Button size="sm" onClick={fetchEbEvents} disabled={ebLoading || !ebToken} style={{ backgroundColor: '#5B4A3A', color: 'white' }}>
                    {ebLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading Events…</> : 'Load Events'}
                  </Button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: '#8B7355' }}>Select Event</label>
                    <select value={ebEventId} onChange={e => setEbEventId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none" style={{ borderColor: '#E8DFD1' }}>
                      <option value="">Choose an event…</option>
                      {ebEvents.map(evt => (
                        <option key={evt.id} value={evt.id}>{evt.name?.text || evt.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" size="sm" onClick={() => { setEbEvents([]); setEbEventId(''); }} style={{ borderColor: '#E8DFD1', color: '#5B4A3A' }}>Change Token</Button>
                    <Button size="sm" onClick={fetchEbAttendees} disabled={ebLoading || !ebEventId} style={{ backgroundColor: '#5B4A3A', color: 'white' }}>
                      {ebLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Fetching Attendees…</> : 'Fetch Attendees'}
                    </Button>
                  </div>
                </>
              )}
              {ebError && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{ebError}</p>}
            </div>
          )}

          {/* ── Preview & Edit ── */}
          {step === 'preview' && (
            <div className="p-6 space-y-4">
              {/* KYPRO-63 / KYPRO-73: a single 'Back' button only. The old header had a
                  top-right 'Import N' button that duplicated the footer 'Import N Members'
                  button. Now the import action lives only in the footer. */}
              <div className="flex items-center justify-between">
                <button onClick={() => { setStep(currentSource === 'manual' ? 'sources' : 'configure'); setPendingMembers([]); }}
                  className="text-sm flex items-center gap-1 hover:underline" style={{ color: '#8B7355' }}>
                  <ChevronLeft className="h-4 w-4" />{currentSource === 'manual' ? 'Back to sources' : 'Back'}
                </button>
                <h3 className="font-semibold" style={{ color: '#3D2E1E' }}>
                  {currentSource === 'manual' ? 'Add Manually' : `Preview — ${pendingMembers.length} contacts`}
                </h3>
                {/* spacer to keep the back button left-aligned and header centered */}
                <span style={{ minWidth: 80 }} />
              </div>

              {currentSource === 'manual' && (
                // KYPRO-35: use a real <form> so the browser only responds to Enter in
                // the way we expect (preventDefault + call addManualMember). The Tags
                // field no longer triggers "premature import" — it only adds one row.
                // KYPRO-66: maxLength on each input so the browser itself caps long strings.
                <form
                  className="p-4 rounded-xl border space-y-3"
                  style={{ borderColor: '#E8DFD1', backgroundColor: '#FDFAF7' }}
                  onSubmit={e => { e.preventDefault(); addManualMember(); }}
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(['name', 'email', 'phone', 'tags'] as const).map(f => {
                      const maxLen = f === 'name' ? MAX_NAME_LEN
                        : f === 'email' ? MAX_EMAIL_LEN
                        : f === 'phone' ? MAX_PHONE_LEN
                        : MAX_TAG_LEN * 10;
                      return (
                        <div key={f}>
                          <label className="text-xs font-medium block mb-1 capitalize" style={{ color: '#8B7355' }}>{f}</label>
                          <input
                            value={manualForm[f]}
                            onChange={e => setManualForm(p => ({ ...p, [f]: e.target.value }))}
                            placeholder={f === 'tags' ? 'tag1, tag2' : f}
                            maxLength={maxLen}
                            type={f === 'email' ? 'email' : f === 'phone' ? 'tel' : 'text'}
                            className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                            style={{ borderColor: '#E8DFD1' }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <Button type="submit" size="sm" style={{ backgroundColor: '#5B4A3A', color: 'white' }}>
                    <Plus className="h-3.5 w-3.5 mr-1" />Add
                  </Button>
                </form>
              )}

              {pendingMembers.length > 0 ? (
                // KYPRO-67: fixed table layout + per-column widths + cell truncation so
                // a 500-char name can no longer push the edit/delete buttons off-screen.
                <div className="overflow-auto rounded-xl border" style={{ borderColor: '#E8DFD1', maxHeight: '40vh' }}>
                  <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: '32px' }} />
                      <col style={{ width: '22%' }} />{/* name */}
                      <col style={{ width: '28%' }} />{/* email */}
                      <col style={{ width: '15%' }} />{/* phone */}
                      <col style={{ width: '12%' }} />{/* tags */}
                      <col style={{ width: '15%' }} />{/* notes */}
                      <col style={{ width: '64px' }} />
                    </colgroup>
                    <thead>
                      <tr style={{ backgroundColor: '#F5F0EB' }}>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: '#8B7355' }}>#</th>
                        {['name', 'email', 'phone', 'tags', 'notes'].map(col => (
                          <th key={col} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: '#8B7355' }}>{col}</th>
                        ))}
                        <th className="px-4" />
                      </tr>
                    </thead>
                    <tbody>
                      {pendingMembers.map((m, i) => (
                        <tr key={m._id} className="border-t hover:bg-amber-50/30" style={{ borderColor: '#F0EBE3' }}>
                          <td className="px-4 py-2 text-xs" style={{ color: '#B0A090' }}>{i + 1}</td>
                          {(['name', 'email', 'phone', 'tags', 'notes'] as const).map(col => {
                            const maxLen = col === 'name' ? MAX_NAME_LEN
                              : col === 'email' ? MAX_EMAIL_LEN
                              : col === 'phone' ? MAX_PHONE_LEN
                              : col === 'tags' ? MAX_TAG_LEN * 10
                              : 500;
                            return (
                              <td key={col} className="px-2 py-1.5" style={{ maxWidth: 0 }}>
                                {editingId === m._id
                                  ? <input
                                      value={m[col]}
                                      maxLength={maxLen}
                                      // KYPRO-64: phone must stay numeric-ish even in inline edit.
                                      onChange={e => {
                                        const v = col === 'phone' ? e.target.value.replace(/[^0-9+\-\s()]/g, '') : e.target.value;
                                        setPendingMembers(p => p.map(x => x._id === m._id ? { ...x, [col]: v } : x));
                                      }}
                                      className="w-full px-2 py-1 rounded border text-sm focus:outline-none"
                                      style={{ borderColor: '#E8DFD1' }}
                                    />
                                  : <span
                                      className="px-2 block overflow-hidden text-ellipsis whitespace-nowrap"
                                      title={m[col] || ''}
                                      style={{ color: m[col] ? '#3D2E1E' : '#C0B0A0' }}
                                    >{m[col] || '—'}</span>}
                              </td>
                            );
                          })}
                          <td className="px-2 py-1.5">
                            <div className="flex gap-1">
                              <button onClick={() => setEditingId(editingId === m._id ? null : m._id)}>
                                {editingId === m._id ? <Save className="h-3.5 w-3.5 text-green-600" /> : <Edit2 className="h-3.5 w-3.5" style={{ color: '#B0A090' }} />}
                              </button>
                              <button onClick={() => setPendingMembers(p => p.filter(x => x._id !== m._id))}>
                                <Trash2 className="h-3.5 w-3.5 text-red-400 hover:text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : currentSource !== 'manual' && (
                <div className="text-center py-12 text-sm" style={{ color: '#B0A090' }}>No contacts loaded.</div>
              )}

              {pendingMembers.length > 0 && (
                <div className="flex justify-end pt-2">
                  <Button onClick={runImport} style={{ backgroundColor: '#5B4A3A', color: 'white' }}>
                    <Download className="h-4 w-4 mr-2" />Import {pendingMembers.length} Members
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ── Importing progress ── */}
          {step === 'importing' && (
            <div className="p-10 text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" style={{ color: '#5B4A3A' }} />
              <h3 className="font-bold text-lg mb-1" style={{ color: '#3D2E1E' }}>Importing Members…</h3>
              <p className="text-sm mb-5" style={{ color: '#8B7355' }}>Please wait, do not close this window.</p>
              <div className="w-full max-w-xs mx-auto bg-gray-100 rounded-full h-3 overflow-hidden">
                <div className="h-3 rounded-full transition-all duration-300" style={{ width: `${importProgress}%`, backgroundColor: '#5B4A3A' }} />
              </div>
              <p className="text-sm font-semibold mt-2" style={{ color: '#5B4A3A' }}>{importProgress}%</p>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
};
