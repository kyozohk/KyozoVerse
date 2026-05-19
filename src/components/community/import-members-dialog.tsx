'use client';

/**
 * ImportMembersDialog (v0.6 UX — "Automatically Integrate")
 *
 * Replaces the older 4-state dialog with the two-panel pattern Mary specced.
 * Sits inside the shared V06DialogShell so the header (purple gradient,
 * Zap icon, close), footer, and width are consistent with every other
 * dialog in the app.
 *
 * Flow:
 *   1. Setup    — source list (left) + source-specific content (right)
 *      CSV/XLSX → drop zone        | Eventbrite → token paste / event picker
 *      GSheets  → URL paste
 *   2. Preview  — filters & bulk action (left) + table (right)
 *   3. Confirm  — summary (left) + tag + notes form (right)
 *   4. Done     — modal closes; reopen for another source
 *
 * Public API matches the previous component so callers don't change.
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  V06DialogShell,
  V06,
  V06PrimaryButton,
  V06SecondaryButton,
  V06ActionButton,
} from '@/components/ui/v06-dialog-shell';
import {
  Upload, FileSpreadsheet, FileText, Calendar, Loader2, Check,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { type Community } from '@/lib/types';
import {
  parseCsv,
  parseGrid,
  sanitizeCell,
  markExistingMembers,
  type ImportRow,
  type ParseResult,
} from '@/lib/import/parse';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  community: Community;
  onSuccess: () => void;
}

type Step = 'setup' | 'preview' | 'confirm' | 'done';
type Source = 'csv' | 'xlsx' | 'eventbrite' | 'gsheets';

interface EventbriteEvent {
  id: string;
  name: string;
  start: string;
  venue?: string;
  attendeeCount?: number;
}

const SOURCE_LABEL: Record<Source, string> = {
  csv: 'CSV File',
  xlsx: 'Excel / XLS',
  eventbrite: 'Eventbrite',
  gsheets: 'Google Sheets',
};

/* -------------------------------------------------------------------------- */
/*  Top-level component                                                       */
/* -------------------------------------------------------------------------- */

export function ImportMembersDialog({ isOpen, onOpenChange, community, onSuccess }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('setup');
  const [source, setSource] = useState<Source>('csv');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setStep('setup');
      setSource('csv');
      setParseResult(null);
      setActiveFilter(null);
      setImporting(false);
    }
  }, [isOpen]);

  const handleParsed = useCallback(
    async (pr: ParseResult) => {
      // Move to Preview immediately so the user sees their rows quickly.
      setParseResult(pr);
      setStep('preview');

      // Fetch existing community dedup keys and cross-mark in the background.
      // We don't block the UI on this; the breakdown updates when keys arrive.
      if (!user) return;
      try {
        const idToken = await user.getIdToken();
        const r = await fetch(
          `/api/v1/communities/${community.communityId}/audience/dedup-keys`,
          {
            method: 'GET',
            headers: { Authorization: `Bearer ${idToken}` },
          }
        );
        if (!r.ok) return;
        const data = (await r.json()) as { keys?: string[] };
        const keys = new Set(data.keys || []);
        if (keys.size === 0) return;
        setParseResult((prev) => (prev ? markExistingMembers(prev, keys) : prev));
      } catch (e) {
        console.warn('[import] existing-dedup-keys fetch failed (continuing):', e);
      }
    },
    [user, community.communityId]
  );

  const toggleRow = useCallback((id: string) => {
    setParseResult((prev) => {
      if (!prev) return prev;
      const rows = prev.rows.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r));
      return { ...prev, rows, selectedCount: rows.filter((r) => r.selected).length };
    });
  }, []);

  const toggleAllVisible = useCallback(() => {
    setParseResult((prev) => {
      if (!prev) return prev;
      const visible = prev.rows.filter((r) =>
        activeFilter ? r.country === activeFilter : true
      );
      const anyOff = visible.some((r) => !r.selected);
      const target = anyOff;
      const visibleIds = new Set(visible.map((r) => r.id));
      const rows = prev.rows.map((r) =>
        visibleIds.has(r.id) ? { ...r, selected: target } : r
      );
      return { ...prev, rows, selectedCount: rows.filter((r) => r.selected).length };
    });
  }, [activeFilter]);

  const bulkSet = useCallback(
    (target: boolean) => {
      setParseResult((prev) => {
        if (!prev || !activeFilter) return prev;
        const rows = prev.rows.map((r) =>
          r.country === activeFilter ? { ...r, selected: target } : r
        );
        return { ...prev, rows, selectedCount: rows.filter((r) => r.selected).length };
      });
    },
    [activeFilter]
  );

  const keepOnly = useCallback(() => {
    setParseResult((prev) => {
      if (!prev || !activeFilter) return prev;
      const rows = prev.rows.map((r) => ({
        ...r,
        selected: r.country === activeFilter,
      }));
      return { ...prev, rows, selectedCount: rows.filter((r) => r.selected).length };
    });
  }, [activeFilter]);

  const handleCommit = useCallback(
    async (tag: string, note: string) => {
      if (!parseResult || !user) return;
      setImporting(true);
      try {
        const rows = parseResult.rows
          .filter((r) => r.selected)
          .map((r) => ({
            name: r.name || undefined,
            email: r.email || undefined,
            phone: r.phone || undefined,
            phoneE164: r.phoneE164 || undefined,
            country: r.country || undefined,
          }));
        const token = await user.getIdToken();
        const res = await fetch(
          `/api/v1/communities/${community.communityId}/audience/import`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ rows, tag, note, source }),
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
        toast({
          title: 'Import complete',
          description: `${data.imported} members added with tag "${tag}".`,
        });
        setStep('done');
        onSuccess();
        setTimeout(() => onOpenChange(false), 700);
      } catch (e) {
        toast({
          title: 'Import failed',
          description: (e as Error).message,
          variant: 'destructive',
        });
      } finally {
        setImporting(false);
      }
    },
    [parseResult, user, community.communityId, source, toast, onSuccess, onOpenChange]
  );

  // ---- Footer per step ----
  let footer: React.ReactNode = null;
  let footerHint: React.ReactNode = null;

  if (step === 'setup') {
    footerHint = `${SOURCE_LABEL[source]} selected · no file uploaded yet`;
    footer = <V06PrimaryButton disabled>Continue to preview →</V06PrimaryButton>;
  } else if (step === 'preview' && parseResult) {
    footerHint = (
      <>
        <strong style={{ color: V06.ink }}>
          {parseResult.selectedCount.toLocaleString()} selected
        </strong>
        {' · '}
        {parseResult.autoDeselected.total} auto-excluded
      </>
    );
    footer = (
      <>
        <V06SecondaryButton onClick={() => setStep('setup')}>Back</V06SecondaryButton>
        <V06PrimaryButton
          onClick={() => setStep('confirm')}
          disabled={parseResult.selectedCount === 0}
        >
          Continue →
        </V06PrimaryButton>
      </>
    );
  }
  // The confirm step renders its own commit button inside the right panel; no footer.

  // ---- Render ----
  if (step === 'done') {
    return (
      <V06DialogShell
        open={isOpen}
        onClose={() => onOpenChange(false)}
        title="Automatically Integrate"
        subtitle="Import complete"
        size="md"
      >
        <DoneBody onClose={() => onOpenChange(false)} />
      </V06DialogShell>
    );
  }

  if (step === 'confirm' && parseResult) {
    return (
      <V06DialogShell
        open={isOpen}
        onClose={() => onOpenChange(false)}
        title="Automatically Integrate"
        subtitle="Confirm · tag this import & review"
        size="xl"
        leftPanel={<ConfirmSummary result={parseResult} source={source} />}
        rightPanel={
          <ConfirmForm
            result={parseResult}
            source={source}
            importing={importing}
            onCommit={handleCommit}
            onBack={() => setStep('preview')}
          />
        }
      />
    );
  }

  if (step === 'preview' && parseResult) {
    return (
      <V06DialogShell
        open={isOpen}
        onClose={() => onOpenChange(false)}
        title="Automatically Integrate"
        subtitle={`Preview · ${parseResult.totalRows.toLocaleString()} contacts found`}
        size="xl"
        leftPanel={
          <PreviewFilters
            result={parseResult}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            onBulkSet={bulkSet}
            onKeepOnly={keepOnly}
          />
        }
        rightPanel={
          <PreviewTable
            result={parseResult}
            activeFilter={activeFilter}
            onToggleRow={toggleRow}
            onToggleAllVisible={toggleAllVisible}
          />
        }
        footer={footer}
        footerHint={footerHint}
      />
    );
  }

  // Default: setup
  return (
    <V06DialogShell
      open={isOpen}
      onClose={() => onOpenChange(false)}
      title="Automatically Integrate"
      subtitle="Consolidate contacts from multiple sources"
      size="xl"
      leftPanel={<SourceList active={source} onChange={setSource} />}
      rightPanel={
        <>
          {(source === 'csv' || source === 'xlsx') && (
            <FileUploadPanel kind={source} onParsed={handleParsed} />
          )}
          {source === 'eventbrite' && <EventbritePanel onParsed={handleParsed} />}
          {source === 'gsheets' && <GoogleSheetsPanel onParsed={handleParsed} />}
        </>
      }
      footer={footer}
      footerHint={footerHint}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Setup — left source list                                                  */
/* -------------------------------------------------------------------------- */

function SourceList({
  active,
  onChange,
}: {
  active: Source;
  onChange: (s: Source) => void;
}) {
  const items: Array<{
    id: Source;
    name: string;
    desc: string;
    Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    tint: string;
    inkTint: string;
  }> = [
    { id: 'csv', name: 'CSV File', desc: '.csv or .tsv', Icon: FileText, tint: '#D4F4DC', inkTint: '#198754' },
    { id: 'xlsx', name: 'Excel / XLS', desc: '.xlsx or .xls', Icon: FileSpreadsheet, tint: '#D4F4DC', inkTint: '#198754' },
    { id: 'eventbrite', name: 'Eventbrite', desc: 'Import event attendees', Icon: Calendar, tint: '#FDD9C1', inkTint: '#B45309' },
    { id: 'gsheets', name: 'Google Sheets', desc: 'Paste a shared sheet URL', Icon: FileSpreadsheet, tint: '#E8DEF8', inkTint: '#7C3AED' },
  ];

  return (
    <>
      <div>
        <h3 className="text-[13px] font-bold mb-1" style={{ color: V06.ink }}>Source</h3>
        <p className="text-[11.5px]" style={{ color: V06.warmMid }}>
          Pick one. Finish, then re-open for another.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((it) => {
          const isActive = it.id === active;
          return (
            <button
              key={it.id}
              onClick={() => onChange(it.id)}
              className="flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-colors"
              style={{
                borderColor: isActive ? V06.warmDeep : V06.ruleSoft,
                background: isActive ? V06.warmDeep : 'white',
                color: isActive ? 'white' : V06.ink,
              }}
            >
              <div
                className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ background: it.tint }}
              >
                <it.Icon className="w-4 h-4" style={{ color: it.inkTint }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold">{it.name}</div>
                <div
                  className="text-[11px]"
                  style={{ color: isActive ? 'rgba(255,255,255,0.7)' : V06.warmMid }}
                >
                  {it.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div
        className="mt-auto p-3 rounded-lg text-[11.5px] leading-snug"
        style={{ background: V06.bgSoft, color: V06.warmMid }}
      >
        <strong style={{ color: V06.ink }}>One source per session.</strong> Members accumulate
        across sessions in the database.
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Setup right panels                                                        */
/* -------------------------------------------------------------------------- */

function FileUploadPanel({
  kind,
  onParsed,
}: {
  kind: 'csv' | 'xlsx';
  onParsed: (pr: ParseResult) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setBusy(true);
      setError(null);
      try {
        if (kind === 'csv') {
          const text = await file.text();
          const result = parseCsv(text);
          if (result.rows.length === 0) throw new Error('File has no parseable rows.');
          onParsed(result);
        } else {
          const XLSX = await import('xlsx');
          const buf = await file.arrayBuffer();
          const wb = XLSX.read(new Uint8Array(buf), { type: 'array' });
          const sheetName = wb.SheetNames[0];
          if (!sheetName) throw new Error('Workbook has no sheets.');
          const grid = XLSX.utils.sheet_to_json<string[]>(wb.Sheets[sheetName], {
            header: 1,
            defval: '',
          }) as string[][];
          if (grid.length === 0) throw new Error('Sheet has no rows.');
          const stringGrid = grid.map((row) => row.map((cell) => String(cell ?? '')));
          const result = parseGrid(stringGrid, { hasHeader: true });
          if (result.rows.length === 0) throw new Error('Sheet has no parseable rows.');
          onParsed(result);
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [kind, onParsed]
  );

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-[15px] font-bold mb-1" style={{ color: V06.ink }}>
          Upload your {kind === 'csv' ? 'CSV' : 'Excel file'}
        </h3>
        <p className="text-[12.5px]" style={{ color: V06.warmMid }}>
          {kind === 'csv' ? 'Phone export or Google Contacts export.' : 'XLSX or XLS. First sheet is parsed.'}
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors"
        style={{
          borderColor: dragOver ? V06.warmDeep : V06.rule,
          background: dragOver ? V06.bgSoft : V06.bgCard,
        }}
      >
        {busy ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: V06.warmDeep }} />
            <div className="text-sm" style={{ color: V06.warmMid }}>Parsing…</div>
          </div>
        ) : (
          <>
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: V06.bgSoft }}
            >
              <Upload className="w-6 h-6" style={{ color: V06.warmDeep }} />
            </div>
            <div className="text-[15px] font-semibold mb-1" style={{ color: V06.ink }}>
              Drop your {kind === 'csv' ? 'CSV' : 'Excel'} here
            </div>
            <div className="text-[12px] mb-3" style={{ color: V06.warmMid }}>
              or click to browse
            </div>
            <span
              className="inline-block px-4 py-2 rounded-md text-[12px] font-semibold"
              style={{ background: V06.btnActionBg, color: V06.btnActionInk }}
            >
              Choose file
            </span>
            <div className="text-[10.5px] mt-3" style={{ color: V06.warmLight }}>
              {kind === 'csv' ? '.CSV · .TSV · UTF-8 preferred' : '.XLSX · .XLS'}
            </div>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={kind === 'csv' ? '.csv,.tsv,text/csv' : '.xlsx,.xls'}
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>

      {error && <ErrorBlock message={error} />}
    </div>
  );
}

/**
 * Eventbrite returns event objects with i18n-shaped fields:
 *   name:  { text: string; html: string }
 *   start: { timezone: string; local: string; utc: string }
 * and venues + ticket classes only when explicitly `expand`ed.
 *
 * Normalize each event down to the flat shape our UI renders. Anything we
 * couldn't parse falls back to a sensible empty string — never an object
 * (React renders strings, not objects).
 */
function normalizeEvent(raw: any): EventbriteEvent {
  let name = '';
  if (typeof raw?.name === 'string') name = raw.name;
  else if (typeof raw?.name?.text === 'string') name = raw.name.text;

  let start = '';
  if (typeof raw?.start === 'string') start = raw.start;
  else if (typeof raw?.start?.local === 'string') start = raw.start.local;
  else if (typeof raw?.start?.utc === 'string') start = raw.start.utc;

  let venue = '';
  if (typeof raw?.venue?.name === 'string') venue = raw.venue.name;
  else if (typeof raw?.venue?.address?.localized_address_display === 'string') {
    venue = raw.venue.address.localized_address_display;
  }

  // Total capacity / sold count when ticket_classes are expanded; otherwise blank.
  let attendeeCount: number | undefined;
  if (Array.isArray(raw?.ticket_classes)) {
    let sold = 0;
    for (const t of raw.ticket_classes) {
      const n = typeof t?.quantity_sold === 'number' ? t.quantity_sold : 0;
      sold += n;
    }
    if (sold > 0) attendeeCount = sold;
  }

  return {
    id: String(raw?.id || ''),
    name,
    start,
    venue,
    attendeeCount,
  };
}

/**
 * Attendee response shape is `{ profile: { name, email, cell_phone, ... } }`.
 * Pull from `profile.*` and fall back to whatever's at the top level.
 */
function attendeeRow(raw: any): [string, string, string] {
  const p = raw?.profile || {};
  const name =
    p.name ||
    [p.first_name, p.last_name].filter(Boolean).join(' ') ||
    raw?.name ||
    '';
  const email = p.email || raw?.email || '';
  const phone = p.cell_phone || raw?.cell_phone || raw?.phone || '';
  return [sanitizeCell(String(name)), sanitizeCell(String(email)), sanitizeCell(String(phone))];
}

function EventbritePanel({ onParsed }: { onParsed: (pr: ParseResult) => void }) {
  const [phase, setPhase] = useState<
    'connect' | 'events' | 'loading_events' | 'loading_attendees'
  >('connect');
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<EventbriteEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  async function loadEvents() {
    if (!token.trim()) return;
    setPhase('loading_events');
    setError(null);
    try {
      const r = await fetch('/api/eventbrite/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'Failed to load events');
      const normalized = Array.isArray(data.events) ? data.events.map(normalizeEvent) : [];
      setEvents(normalized);
      setPhase('events');
    } catch (e) {
      setError((e as Error).message);
      setPhase('connect');
    }
  }

  async function loadAttendees(eventId: string) {
    setSelectedEvent(eventId);
    setPhase('loading_attendees');
    setError(null);
    try {
      const r = await fetch('/api/eventbrite/attendees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), eventId }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'Failed to load attendees');
      const rawAttendees = Array.isArray(data.attendees) ? data.attendees : [];
      const grid: string[][] = [
        ['name', 'email', 'phone'],
        ...rawAttendees.map(attendeeRow),
      ];
      const result = parseGrid(grid, { hasHeader: true });
      if (result.rows.length === 0) {
        throw new Error(
          'No attendees with contact info on this event yet. Try a different event.'
        );
      }
      onParsed(result);
    } catch (e) {
      setError((e as Error).message);
      setPhase('events');
    }
  }

  if (phase === 'connect' || phase === 'loading_events') {
    return (
      <div>
        <h3 className="text-[15px] font-bold mb-1" style={{ color: V06.ink }}>Connect Eventbrite</h3>
        <p className="text-[12.5px] mb-4" style={{ color: V06.warmMid }}>
          Paste your <strong>Private token</strong> to load your events. Not the API key —
          Eventbrite uses the Private token to authenticate API calls.
        </p>
        <FieldLabel>PRIVATE TOKEN</FieldLabel>
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="e.g. ANJ7O62BP4X7CBMZBAOF"
          className="w-full px-3.5 py-2.5 rounded-lg text-sm font-mono"
          style={{ background: V06.bgCard, border: `1.5px solid ${V06.ruleSoft}` }}
          autoComplete="off"
          spellCheck={false}
        />
        <div className="text-[11.5px] mt-1.5 leading-snug" style={{ color: V06.warmMid }}>
          Eventbrite → <strong>Account Settings</strong> → <strong>Developer Links</strong> →{' '}
          <strong>API Keys</strong> → expand your key → copy the <strong>Private token</strong>{' '}
          (not the API key, Client secret, or Public token).
        </div>
        <div className="mt-4">
          <V06ActionButton onClick={loadEvents} disabled={!token.trim() || phase === 'loading_events'}>
            {phase === 'loading_events' ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading events…
              </span>
            ) : (
              'Load events'
            )}
          </V06ActionButton>
        </div>
        {error && <ErrorBlock message={error} />}
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-[15px] font-bold mb-1" style={{ color: V06.ink }}>Pick an event</h3>
      <p className="text-[12.5px] mb-4" style={{ color: V06.warmMid }}>
        Attendees flow into the same Preview.
      </p>
      <div className="flex flex-col gap-2 rounded-xl overflow-hidden" style={{ border: `1.5px solid ${V06.ruleSoft}` }}>
        {events.length === 0 && (
          <div className="text-[12.5px] italic p-4" style={{ color: V06.warmMid }}>
            No events found on this account.
          </div>
        )}
        {events.map((ev, idx) => {
          const isLoading = phase === 'loading_attendees' && selectedEvent === ev.id;
          const isSelected = selectedEvent === ev.id;
          return (
            <EventRow
              key={ev.id}
              event={ev}
              isLoading={isLoading}
              isSelected={isSelected}
              isFirst={idx === 0}
              disabled={phase === 'loading_attendees'}
              onClick={() => loadAttendees(ev.id)}
            />
          );
        })}
      </div>
      {error && <ErrorBlock message={error} />}
    </div>
  );
}

/**
 * Single event row in the Eventbrite picker.
 *
 * Layout mirrors the v0.6 mockup:
 *   [ cream date block ]   bold title          ··· N attendees   ( ◉ )
 *                          venue · status
 */
function EventRow({
  event,
  isLoading,
  isSelected,
  isFirst,
  disabled,
  onClick,
}: {
  event: EventbriteEvent;
  isLoading: boolean;
  isSelected: boolean;
  isFirst: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  let month = '';
  let day = '';
  if (event.start) {
    const d = new Date(event.start);
    if (!Number.isNaN(d.valueOf())) {
      month = d.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
      day = String(d.getDate());
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-4 px-4 py-3 text-left disabled:opacity-60 transition-colors"
      style={{
        background: isSelected ? V06.bgSoft : 'white',
        borderTop: isFirst ? 'none' : `1px solid ${V06.ruleSoft}`,
      }}
    >
      <div
        className="w-14 h-14 rounded-lg flex flex-col items-center justify-center flex-shrink-0"
        style={{ background: V06.bgSoft }}
      >
        <div
          className="text-[10px] font-bold leading-none"
          style={{ color: V06.warmDeep, letterSpacing: '0.08em' }}
        >
          {month || '—'}
        </div>
        <div
          className="text-[20px] font-bold leading-none mt-1"
          style={{ color: V06.warmDeep, fontFamily: 'Georgia, serif' }}
        >
          {day || '?'}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-bold truncate" style={{ color: V06.ink }}>
          {event.name || 'Untitled event'}
        </div>
        <div className="text-[12px] truncate" style={{ color: V06.warmMid }}>
          {event.venue || ' '}
        </div>
      </div>
      <div
        className="text-[12.5px] flex-shrink-0 whitespace-nowrap"
        style={{ color: V06.warmMid }}
      >
        <strong style={{ color: V06.ink }}>
          {typeof event.attendeeCount === 'number' ? event.attendeeCount : '—'}
        </strong>{' '}
        attendees
      </div>
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          border: `2px solid ${isSelected ? V06.warmDeep : V06.warmLight}`,
          background: 'white',
        }}
      >
        {isLoading ? (
          <Loader2 className="w-3 h-3 animate-spin" style={{ color: V06.warmDeep }} />
        ) : isSelected ? (
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: V06.warmDeep }}
          />
        ) : null}
      </div>
    </button>
  );
}

function GoogleSheetsPanel({ onParsed }: { onParsed: (pr: ParseResult) => void }) {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function extractSheetId(s: string): string | null {
    const m = s.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return m ? m[1] : null;
  }

  async function load() {
    setError(null);
    const id = extractSheetId(url);
    if (!id) {
      setError('Could not find a sheet id in that URL. Paste the full Google Sheets URL.');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(
        `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`,
        { method: 'GET' }
      );
      if (!r.ok) {
        throw new Error(
          `Couldn't fetch the sheet (HTTP ${r.status}). Make sure it's shared as "Anyone with the link can view".`
        );
      }
      const text = await r.text();
      const result = parseCsv(text);
      if (result.rows.length === 0) throw new Error('Sheet has no parseable rows.');
      onParsed(result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h3 className="text-[15px] font-bold mb-1" style={{ color: V06.ink }}>Load a Google Sheet</h3>
      <p className="text-[12.5px] mb-4" style={{ color: V06.warmMid }}>
        Share the sheet as <strong>"Anyone with the link can view"</strong>, then paste its URL.
      </p>
      <FieldLabel>SHEET URL</FieldLabel>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://docs.google.com/spreadsheets/d/…"
        className="w-full px-3.5 py-2.5 rounded-lg text-sm"
        style={{ background: V06.bgCard, border: `1.5px solid ${V06.ruleSoft}` }}
      />
      <div className="mt-4">
        <V06ActionButton onClick={load} disabled={!url.trim() || busy}>
          {busy ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading sheet…
            </span>
          ) : (
            'Load sheet'
          )}
        </V06ActionButton>
      </div>
      {error && <ErrorBlock message={error} />}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Preview                                                                   */
/* -------------------------------------------------------------------------- */

const COUNTRY_LABEL: Record<string, string> = {
  HK: 'HK +852',
  GB: 'UK +44',
  US: 'US +1',
  SG: 'SG +65',
  AU: 'AU +61',
  CA: 'CA +1',
  IN: 'IN +91',
  FR: 'FR +33',
  DE: 'DE +49',
  JP: 'JP +81',
};

function PreviewFilters({
  result,
  activeFilter,
  onFilterChange,
  onBulkSet,
  onKeepOnly,
}: {
  result: ParseResult;
  activeFilter: string | null;
  onFilterChange: (c: string | null) => void;
  onBulkSet: (target: boolean) => void;
  onKeepOnly: () => void;
}) {
  const visibleCount = activeFilter
    ? result.rows.filter((r) => r.country === activeFilter).length
    : result.totalRows;

  return (
    <>
      <div>
        <h3 className="text-[13px] font-bold mb-1" style={{ color: V06.ink }}>Filter</h3>
        <p className="text-[11.5px]" style={{ color: V06.warmMid }}>
          Trim before importing.
        </p>
      </div>

      {result.autoDeselected.total > 0 && (
        <div
          className="p-3 rounded-md text-[11.5px] leading-snug"
          style={{ background: V06.bgSoft, color: V06.warmMid }}
        >
          <strong style={{ color: V06.ink }}>
            {result.autoDeselected.total} auto-deselected
          </strong>
          {' · '}
          {[
            result.autoDeselected.empty > 0
              ? `${result.autoDeselected.empty} no contact info`
              : null,
            result.autoDeselected.duplicates > 0
              ? `${result.autoDeselected.duplicates} duplicates in file`
              : null,
            result.autoDeselected.existing > 0
              ? `${result.autoDeselected.existing} already members`
              : null,
          ]
            .filter(Boolean)
            .join(', ')}
          {result.autoDeselected.existing > 0 && (
            <div className="mt-1.5 text-[11px]" style={{ color: V06.warmMid }}>
              Re-tick any row to re-import it (the server merges on email/phone,
              so no duplicate is created).
            </div>
          )}
        </div>
      )}

      {result.countryGroups.length > 0 && (
        <div>
          <div
            className="text-[10.5px] font-bold uppercase mb-2"
            style={{ color: V06.warmMid, letterSpacing: '0.12em' }}
          >
            By country code
          </div>
          <div className="flex flex-col gap-1">
            <FilterRow
              label="All"
              count={result.totalRows}
              active={activeFilter === null}
              onClick={() => onFilterChange(null)}
            />
            {result.countryGroups.map((g) => (
              <FilterRow
                key={g.country}
                label={COUNTRY_LABEL[g.country] || g.country}
                count={g.count}
                active={activeFilter === g.country}
                onClick={() => onFilterChange(g.country)}
              />
            ))}
          </div>
        </div>
      )}

      {activeFilter && (
        <div
          className="p-3 rounded-lg flex flex-col gap-2"
          style={{ background: V06.bgSoft, border: `1.5px solid ${V06.rule}` }}
        >
          <div className="text-[11.5px]" style={{ color: V06.ink }}>
            <strong>{visibleCount} contacts match</strong> ·{' '}
            {COUNTRY_LABEL[activeFilter] || activeFilter}
          </div>
          <button
            onClick={() => onBulkSet(false)}
            className="px-3 py-1.5 rounded-md text-[11.5px] font-semibold"
            style={{ background: V06.warmDeep, color: 'white' }}
          >
            Deselect all {visibleCount}
          </button>
          <button
            onClick={onKeepOnly}
            className="px-3 py-1.5 rounded-md text-[11.5px] font-semibold"
            style={{ background: V06.btnActionBg, color: V06.btnActionInk }}
          >
            Keep only these
          </button>
          <button
            onClick={() => onFilterChange(null)}
            className="px-3 py-1.5 rounded-md text-[11.5px] font-semibold"
            style={{
              background: 'white',
              color: V06.warmMid,
              border: `1px solid ${V06.ruleSoft}`,
            }}
          >
            Clear filter
          </button>
        </div>
      )}

      <div
        className="mt-auto p-3 rounded-lg"
        style={{ background: 'white', border: `1.5px solid ${V06.ruleSoft}` }}
      >
        <div className="text-[22px]" style={{ color: V06.warmDeep, fontFamily: 'Georgia, serif' }}>
          {result.selectedCount.toLocaleString()}{' '}
          <span className="text-[12.5px]" style={{ color: V06.warmMid }}>
            / {result.totalRows.toLocaleString()}
          </span>
        </div>
        <div className="text-[11.5px]" style={{ color: V06.warmMid }}>
          selected to import · {result.totalRows - result.selectedCount} excluded
        </div>
      </div>
    </>
  );
}

function PreviewTable({
  result,
  activeFilter,
  onToggleRow,
  onToggleAllVisible,
}: {
  result: ParseResult;
  activeFilter: string | null;
  onToggleRow: (id: string) => void;
  onToggleAllVisible: () => void;
}) {
  const visibleRows = useMemo(() => {
    if (!activeFilter) return result.rows;
    return result.rows.filter((r) => r.country === activeFilter);
  }, [result.rows, activeFilter]);

  const visibleSelectedCount = visibleRows.filter((r) => r.selected).length;
  const headerCheckboxState: 'on' | 'off' | 'indeterminate' =
    visibleSelectedCount === 0
      ? 'off'
      : visibleSelectedCount === visibleRows.length
        ? 'on'
        : 'indeterminate';

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="mb-3 flex-shrink-0">
        <h3 className="text-[15px] font-bold" style={{ color: V06.ink }}>
          {activeFilter
            ? `${COUNTRY_LABEL[activeFilter] || activeFilter} · ${visibleRows.length} contacts`
            : `Preview · ${result.totalRows.toLocaleString()} contacts`}
        </h3>
        <p className="text-[12px]" style={{ color: V06.warmMid }}>
          All checked except {result.autoDeselected.total} auto-deselected. Untick to exclude.
        </p>
      </div>

      <div
        className="flex-1 min-h-0 overflow-auto rounded-lg border"
        style={{ borderColor: V06.ruleSoft }}
      >
        <table className="w-full text-[12.5px]">
          <thead
            className="sticky top-0 z-10"
            style={{ background: V06.bgCard, borderBottom: `1px solid ${V06.ruleSoft}` }}
          >
            <tr>
              <th className="w-10 text-center p-2">
                <Checkbox state={headerCheckboxState} onClick={onToggleAllVisible} />
              </th>
              <th className="w-10 text-left p-2 font-semibold" style={{ color: V06.warmMid }}>#</th>
              <th className="text-left p-2 font-semibold" style={{ color: V06.warmMid }}>Name</th>
              <th className="text-left p-2 font-semibold" style={{ color: V06.warmMid }}>Email</th>
              <th className="text-left p-2 font-semibold" style={{ color: V06.warmMid }}>Phone</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.slice(0, 500).map((r) => (
              <PreviewRow key={r.id} row={r} onToggle={() => onToggleRow(r.id)} />
            ))}
          </tbody>
        </table>
        {visibleRows.length > 500 && (
          <div className="text-center text-[10.5px] py-2" style={{ color: V06.warmLight }}>
            ↓ Showing 500 of {visibleRows.length.toLocaleString()}. Filter to narrow.
          </div>
        )}
      </div>
    </div>
  );
}

function FilterRow({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between px-3 py-2 rounded-md text-[12.5px] transition-colors text-left"
      style={{
        background: active ? V06.warmDeep : 'transparent',
        color: active ? 'white' : V06.ink,
        fontWeight: active ? 600 : 500,
      }}
    >
      <span>{label}</span>
      <span style={{ color: active ? 'rgba(255,255,255,0.7)' : V06.warmMid }}>
        {count.toLocaleString()}
      </span>
    </button>
  );
}

function PreviewRow({ row, onToggle }: { row: ImportRow; onToggle: () => void }) {
  const dimmed = !row.selected;
  return (
    <tr
      onClick={onToggle}
      className="cursor-pointer"
      style={{ borderBottom: `1px solid ${V06.ruleSoft}` }}
    >
      <td className="text-center p-2">
        <Checkbox state={row.selected ? 'on' : 'off'} onClick={onToggle} />
      </td>
      <td className="p-2" style={{ color: dimmed ? V06.warmLight : V06.warmMid }}>
        {row.index}
      </td>
      <td
        className="p-2"
        style={{
          color: dimmed ? V06.warmLight : V06.ink,
          textDecoration: dimmed ? 'line-through' : 'none',
        }}
      >
        {row.name ||
          (row.deselectedReason === 'empty'
            ? '(empty)'
            : row.deselectedReason === 'existing'
              ? '(existing member)'
              : '—')}
      </td>
      <td
        className="p-2"
        style={{
          color: dimmed ? V06.warmLight : V06.warmMid,
          textDecoration: dimmed ? 'line-through' : 'none',
        }}
      >
        {row.email || '—'}
      </td>
      <td
        className="p-2"
        style={{
          color: dimmed ? V06.warmLight : V06.warmMid,
          textDecoration: dimmed ? 'line-through' : 'none',
        }}
      >
        {row.country && (
          <span
            className="inline-block text-[10px] font-bold rounded px-1 py-0.5 mr-1.5"
            style={{ background: V06.bgSoft, color: V06.warmMid }}
          >
            {row.country}
          </span>
        )}
        {row.phoneE164 || row.phone || '—'}
      </td>
    </tr>
  );
}

function Checkbox({
  state,
  onClick,
}: {
  state: 'on' | 'off' | 'indeterminate';
  onClick?: (e: React.MouseEvent) => void;
}) {
  const isOn = state === 'on';
  const isInd = state === 'indeterminate';
  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      className="inline-block w-4 h-4 rounded relative cursor-pointer align-middle"
      style={{
        border: `2px solid ${isOn || isInd ? V06.warmDeep : V06.warmLight}`,
        background: isOn || isInd ? V06.warmDeep : 'white',
      }}
    >
      {isOn && (
        <span className="absolute inset-0 flex items-center justify-center text-white text-[11px] font-bold">
          ✓
        </span>
      )}
      {isInd && (
        <span className="absolute inset-0 flex items-center justify-center text-white text-[12px] font-bold leading-none">
          –
        </span>
      )}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Confirm                                                                   */
/* -------------------------------------------------------------------------- */

function ConfirmSummary({ result, source }: { result: ParseResult; source: Source }) {
  const excludedManual = result.totalRows - result.selectedCount - result.autoDeselected.total;
  return (
    <>
      <div>
        <h3 className="text-[13px] font-bold mb-1" style={{ color: V06.ink }}>Summary</h3>
        <p className="text-[11.5px]" style={{ color: V06.warmMid }}>
          Review before committing.
        </p>
      </div>
      <div
        className="rounded-xl p-4"
        style={{ background: 'white', border: `1.5px solid ${V06.ruleSoft}` }}
      >
        <div className="text-[13px] font-bold mb-3" style={{ color: V06.ink }}>Ready to import</div>
        <SummaryRow k="Source" v={SOURCE_LABEL[source]} />
        <SummaryRow k="Found" v={`${result.totalRows.toLocaleString()} contacts`} />
        <SummaryRow k="Auto-deselected" v={result.autoDeselected.total.toLocaleString()} />
        {excludedManual > 0 && (
          <SummaryRow k="You excluded" v={excludedManual.toLocaleString()} />
        )}
        <SummaryRow k="Importing" v={result.selectedCount.toLocaleString()} big />
      </div>
      <div
        className="p-3 rounded-md text-[11.5px]"
        style={{ background: V06.bgSoft, color: V06.warmMid }}
      >
        Tagging on the right applies to all{' '}
        <strong style={{ color: V06.ink }}>{result.selectedCount.toLocaleString()}</strong>{' '}
        imported members.
      </div>
    </>
  );
}

function ConfirmForm({
  result,
  source,
  importing,
  onCommit,
  onBack,
}: {
  result: ParseResult;
  source: Source;
  importing: boolean;
  onCommit: (tag: string, note: string) => void;
  onBack: () => void;
}) {
  const defaultTag = `${SOURCE_LABEL[source]} · ${new Date().toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  })}`;
  const [tag, setTag] = useState(defaultTag);
  const [note, setNote] = useState('');

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-[15px] font-bold mb-1" style={{ color: V06.ink }}>Tag this import</h3>
        <p className="text-[12.5px]" style={{ color: V06.warmMid }}>
          Find this batch in your Audience later by the tag.
        </p>
      </div>

      <FieldLabel>TAG NAME</FieldLabel>
      <input
        value={tag}
        onChange={(e) => setTag(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-lg text-sm"
        style={{ background: V06.bgCard, border: `1.5px solid ${V06.ruleSoft}` }}
      />
      <div className="text-[11.5px] mt-1.5" style={{ color: V06.warmMid }}>
        Applies one tag to every contact in this batch.
      </div>

      <div className="mt-5">
        <FieldLabel>NOTES (OPTIONAL)</FieldLabel>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. cleaned UK numbers out before importing"
          className="w-full px-3.5 py-2.5 rounded-lg text-sm"
          style={{ background: V06.bgCard, border: `1.5px solid ${V06.ruleSoft}` }}
        />
        <div className="text-[11.5px] mt-1.5" style={{ color: V06.warmMid }}>
          Stored with the import record. Helps you remember context later.
        </div>
      </div>

      <div className="mt-auto pt-6 flex items-center justify-between gap-3">
        <V06SecondaryButton onClick={onBack} disabled={importing}>Back</V06SecondaryButton>
        <button
          onClick={() => onCommit(tag.trim(), note.trim())}
          disabled={importing || !tag.trim() || result.selectedCount === 0}
          className="px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-60"
          style={{ background: V06.btnPrimaryBg, color: 'white' }}
        >
          {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Confirm · Import{' '}
          <span
            className="px-2 py-0.5 rounded-md text-[11.5px]"
            style={{ background: 'rgba(255,255,255,0.18)' }}
          >
            {result.selectedCount.toLocaleString()}
          </span>
        </button>
      </div>
    </div>
  );
}

function SummaryRow({ k, v, big = false }: { k: string; v: string; big?: boolean }) {
  return (
    <div
      className="flex items-center justify-between py-2"
      style={{ borderTop: `1px solid ${V06.ruleSoft}` }}
    >
      <span className="text-[12px]" style={{ color: V06.warmMid }}>{k}</span>
      <span
        className={big ? 'text-[22px] font-semibold' : 'text-[12.5px] font-semibold'}
        style={{
          color: big ? V06.warmDeep : V06.ink,
          fontFamily: big ? 'Georgia, serif' : undefined,
        }}
      >
        {v}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Done                                                                      */
/* -------------------------------------------------------------------------- */

function DoneBody({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center p-12">
      <div className="text-center">
        <div
          className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4"
          style={{ background: V06.bgSoft }}
        >
          <Check className="w-7 h-7" style={{ color: V06.warmDeep }} />
        </div>
        <div className="text-[20px] font-bold mb-1" style={{ color: V06.ink }}>Import complete</div>
        <div className="text-[13px] mb-5" style={{ color: V06.warmMid }}>
          Re-open to import another source.
        </div>
        <V06PrimaryButton onClick={onClose}>Done</V06PrimaryButton>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Small reusable bits                                                       */
/* -------------------------------------------------------------------------- */

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="block text-[10.5px] font-bold mb-1.5"
      style={{ color: V06.warmMid, letterSpacing: '0.12em' }}
    >
      {children}
    </label>
  );
}

function ErrorBlock({ message }: { message: string }) {
  return (
    <div
      className="mt-3 flex items-start gap-2 p-3 rounded-md text-[12px]"
      style={{ background: '#FEE2E2', color: '#991B1B' }}
    >
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}
