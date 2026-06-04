'use client';

/**
 * AutoIntegrateWizard — "Automatically Integrate" contact-consolidation flow,
 * presented as a modal dialog and built on the reusable <ProcessFlow>.
 *
 * Flow: Import → Review → Communities → Tag → Confirm → Create → Done
 *   - Import:      pick a source (CSV/XLSX upload or Eventbrite), parse, then
 *                  Gemini-clean + country-tag + dedup inline (no separate step).
 *   - Review:      scan the consolidated contacts (count shown in the header).
 *   - Communities: build communities — name, icon, banner, lore, tags
 *                  (mirrors the Create Community dialog fields).
 *   - Tag:         see every imported member + the batch tag they'll carry.
 *   - Confirm:     summary.
 *   - Create:      per community → create → upload icon/banner → set up email
 *                  subdomain → import the contacts.
 *   - Done:        jump into the first new community.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Upload,
  FileText,
  Users,
  Link2,
  Calendar,
  Check,
  Search,
  Plus,
  X,
  Loader2,
  Sparkles,
  Globe,
  ImagePlus,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/firebase/firestore';
import { doc, updateDoc } from 'firebase/firestore';
import { uploadFile } from '@/lib/upload-helper';
import { ProcessFlow, ProcessStepHeader, ProcessButton, type ProcessStep } from '@/components/ui/process-flow';
import {
  parseCsv,
  parseGrid,
  applyCleanResults,
  type ParseResult,
  type CleanedRow,
} from '@/lib/import/parse';

const T = {
  bg: '#F6F2EA',
  panel: '#FFFFFF',
  accent: '#BF5B30',
  heading: '#1E2A47',
  subtext: '#7C7468',
  border: '#E7DFD2',
  ink: '#3D2E1E',
};

const STEPS: ProcessStep[] = [
  { key: 'import', label: 'Import' },
  { key: 'review', label: 'Review' },
  { key: 'communities', label: 'Communities' },
  { key: 'tag', label: 'Tag' },
  { key: 'confirm', label: 'Confirm' },
  { key: 'create', label: 'Create' },
  { key: 'done', label: 'Done' },
];

interface CommunityDraft {
  id: string;
  name: string;
  lore: string;
  tags: string[];
  iconFile: File | null;
  iconPreview: string;
  bannerFile: File | null;
  bannerPreview: string;
}

function emptyCommunity(i: number): CommunityDraft {
  return { id: `c-${i}-${Math.random().toString(36).slice(2, 7)}`, name: '', lore: '', tags: [], iconFile: null, iconPreview: '', bannerFile: null, bannerPreview: '' };
}

type CreateStatus = 'pending' | 'creating' | 'uploading' | 'subdomain' | 'importing' | 'done' | 'error';
interface CreateProgress {
  name: string;
  handle?: string;
  status: CreateStatus;
  subdomainOk?: boolean;
  imported?: number;
  error?: string;
}

export function AutoIntegrateWizard({
  isOpen,
  onClose,
  onComplete,
}: {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (handle: string) => void;
}) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [communities, setCommunities] = useState<CommunityDraft[]>([emptyCommunity(1)]);
  const [tags, setTags] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('all');
  const [progress, setProgress] = useState<CreateProgress[]>([]);
  const [doneHandles, setDoneHandles] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setParseResult(null);
      setProcessing(false);
      setCommunities([emptyCommunity(1)]);
      setTags([]);
      setSearch('');
      setCountry('all');
      setProgress([]);
      setDoneHandles([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const selectedRows = parseResult?.rows.filter((r) => r.selected) ?? [];
  const memberRows = selectedRows
    .filter((r) => {
      const q = search.trim().toLowerCase();
      if (country !== 'all' && r.country !== country) return false;
      if (q && !`${r.name} ${r.email}`.toLowerCase().includes(q)) return false;
      return true;
    })
    .map((r) => ({
      name: r.name || undefined,
      email: r.email || undefined,
      phone: r.phone || undefined,
      phoneE164: r.phoneE164 || undefined,
      country: r.country || undefined,
    }));

  const activeCommunities = communities.filter((c) => c.name.trim());
  const parsedCount = parseResult?.selectedCount ?? 0;

  /* ---- parse + Gemini clean inline, then jump to Review ---- */
  const ingest = async (pr: ParseResult) => {
    setParseResult(pr);
    setProcessing(true);
    try {
      if (user) {
        const token = await user.getIdToken();
        const payload = pr.rows.map((r) => ({ index: r.index, name: r.name, email: r.email, phone: r.phone }));
        const res = await fetch('/api/v1/import/clean', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ rows: payload }),
        });
        if (res.ok) {
          const data = (await res.json()) as { cleaned?: CleanedRow[] };
          if (data.cleaned?.length) setParseResult(applyCleanResults(pr, data.cleaned));
        }
      }
    } catch (e) {
      console.warn('[wizard] clean failed (continuing):', e);
    } finally {
      setProcessing(false);
      setStep(1); // → Review
    }
  };

  const handleFile = async (file: File) => {
    let pr: ParseResult;
    if (/\.(xlsx|xls)$/i.test(file.name)) {
      const XLSX = await import('xlsx');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(buf), { type: 'array' });
      const grid = XLSX.utils.sheet_to_json<string[]>(wb.Sheets[wb.SheetNames[0]], { header: 1 });
      pr = parseGrid(grid.map((row) => row.map((c) => String(c ?? ''))));
    } else {
      pr = parseCsv(await file.text());
    }
    await ingest(pr);
  };

  const handleEventbrite = async (rows: Array<{ name: string; email: string; phone: string }>) => {
    const grid = [['name', 'email', 'phone'], ...rows.map((r) => [r.name, r.email, r.phone])];
    await ingest(parseGrid(grid));
  };

  /* ---- create + upload + subdomain + import ---- */
  const runCreate = async () => {
    if (!user) return;
    const token = await user.getIdToken();
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    setProgress(activeCommunities.map((c) => ({ name: c.name.trim(), status: 'pending' })));

    const handles: string[] = [];
    for (let i = 0; i < activeCommunities.length; i++) {
      const c = activeCommunities[i];
      const patch = (p: Partial<CreateProgress>) =>
        setProgress((prev) => prev.map((row, idx) => (idx === i ? { ...row, ...p } : row)));
      try {
        patch({ status: 'creating' });
        const cRes = await fetch('/api/v1/communities/create', {
          method: 'POST',
          headers,
          body: JSON.stringify({ name: c.name.trim(), tags: c.tags, description: c.lore }),
        });
        const cData = await cRes.json();
        if (!cRes.ok) throw new Error(cData?.error || 'create failed');
        const { communityId, handle } = cData as { communityId: string; handle: string };
        patch({ handle });

        // upload icon / banner (best-effort) and write the URLs
        if (c.iconFile || c.bannerFile) {
          patch({ status: 'uploading' });
          const update: Record<string, string> = {};
          try {
            if (c.iconFile) {
              const r = await uploadFile(c.iconFile, communityId);
              update.communityProfileImage = typeof r === 'string' ? r : r.url;
            }
            if (c.bannerFile) {
              const r = await uploadFile(c.bannerFile, communityId);
              update.communityBackgroundImage = typeof r === 'string' ? r : r.url;
            }
            if (Object.keys(update).length) await updateDoc(doc(db, 'communities', communityId), update);
          } catch (e) {
            console.warn('[wizard] image upload failed (continuing):', e);
          }
        }

        // email subdomain (best-effort)
        patch({ status: 'subdomain' });
        let subdomainOk = false;
        try {
          const dRes = await fetch('/api/setup-community-domain', { method: 'POST', headers, body: JSON.stringify({ handle }) });
          subdomainOk = dRes.ok;
        } catch {
          subdomainOk = false;
        }
        patch({ subdomainOk });

        // import contacts
        patch({ status: 'importing' });
        const iRes = await fetch(`/api/v1/communities/${communityId}/audience/import`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ rows: memberRows, tags, source: 'csv' }),
        });
        const iData = await iRes.json();
        if (!iRes.ok) throw new Error(iData?.error || 'import failed');

        patch({ status: 'done', imported: iData.imported ?? memberRows.length });
        handles.push(handle);
      } catch (e) {
        patch({ status: 'error', error: (e as Error).message });
      }
    }
    setDoneHandles(handles);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(20,16,12,0.55)' }}>
      <div
        className="relative w-full max-w-[1150px] h-[90vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        style={{ backgroundColor: T.bg }}
      >
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: T.border, backgroundColor: T.bg }}
        >
          <div className="flex items-center gap-3">
            <span className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: T.heading }}>
              K
            </span>
            <span className="font-medium" style={{ color: T.heading }}>
              Kyozo · Contact Consolidation Tool
            </span>
            {parsedCount > 0 && (
              <span className="ml-2 rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: '#F1ECE2', color: T.ink }}>
                {parsedCount.toLocaleString()} contacts parsed
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm" style={{ color: T.subtext }}>
              {user?.email}
            </span>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-black/5" aria-label="Close">
              <X className="h-5 w-5" style={{ color: T.subtext }} />
            </button>
          </div>
        </header>

        <ProcessFlow steps={STEPS} current={step} onStepClick={(i) => i < step && setStep(i)} className="flex-1">
          <main className="max-w-5xl mx-auto px-6 py-10 w-full">
            {step === 0 && <ImportStep onFile={handleFile} onEventbrite={handleEventbrite} />}
            {step === 1 && <ReviewStep parseResult={parseResult} onNext={goNext} onBack={goBack} />}
            {step === 2 && (
              <CommunitiesStep communities={communities} setCommunities={setCommunities} onNext={goNext} onBack={goBack} />
            )}
            {step === 3 && (
              <TagStep
                parseResult={parseResult}
                setParseResult={setParseResult}
                tags={tags}
                setTags={setTags}
                search={search}
                setSearch={setSearch}
                country={country}
                setCountry={setCountry}
                onNext={goNext}
                onBack={goBack}
              />
            )}
            {step === 4 && (
              <ConfirmStep communities={activeCommunities} memberCount={memberRows.length} tags={tags} onNext={goNext} onBack={goBack} />
            )}
            {step === 5 && (
              <CreateStep
                progress={progress}
                run={runCreate}
                done={progress.length > 0 && progress.every((p) => p.status === 'done' || p.status === 'error')}
                onNext={goNext}
              />
            )}
            {step === 6 && (
              <DoneStep
                handles={doneHandles}
                communityCount={activeCommunities.length}
                memberCount={memberRows.length}
                onGo={() => (doneHandles[0] ? onComplete?.(doneHandles[0]) : onClose())}
              />
            )}
          </main>
        </ProcessFlow>

        {/* Floating Back — bottom-left, frees vertical room at the top.
            Shown only on steps you can go back from (Review→Confirm). */}
        {step >= 1 && step <= 4 && (
          <button
            type="button"
            onClick={goBack}
            className="absolute bottom-5 left-5 z-20 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-md hover:shadow-lg transition-shadow"
            style={{ background: T.panel, color: T.ink, border: `1px solid ${T.border}` }}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        )}

        {/* Inline processing overlay (replaces the old Process step) */}
        {processing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'rgba(246,242,234,0.94)' }}>
            <Loader2 className="h-12 w-12 animate-spin mb-6" style={{ color: T.accent }} />
            <p className="text-base" style={{ color: T.ink }}>
              Cleaning names, tagging by country & de-duplicating with AI…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 1 — Import                                                           */
/* -------------------------------------------------------------------------- */

function SourceCard({
  icon,
  title,
  subtitle,
  action,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-2xl border p-6 flex flex-col" style={{ borderColor: T.border, backgroundColor: T.panel, opacity: disabled ? 0.55 : 1 }}>
      <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: '#F1ECE2', color: T.ink }}>
        {icon}
      </div>
      <h3 className="text-lg font-bold" style={{ color: T.heading }}>
        {title}
      </h3>
      <p className="text-sm mb-5" style={{ color: T.subtext }}>
        {subtitle}
      </p>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="mt-auto w-full rounded-xl py-3 text-sm font-semibold text-white disabled:cursor-not-allowed"
        style={{ backgroundColor: disabled ? '#C9BCA8' : T.accent }}
      >
        {action}
      </button>
    </div>
  );
}

function ImportStep({
  onFile,
  onEventbrite,
}: {
  onFile: (file: File) => void;
  onEventbrite: (rows: Array<{ name: string; email: string; phone: string }>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [showEb, setShowEb] = useState(false);

  return (
    <div>
      <ProcessStepHeader title="Bring your contacts together." subtitle="Drop them in once. We'll clean, tag and de-duplicate the rest." />
      <input
        ref={fileRef}
        type="file"
        accept=".csv,.tsv,.xlsx,.xls,text/csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <SourceCard icon={<Upload className="h-6 w-6" />} title="Phone CSV" subtitle="iOS / Android export" action="Upload" onClick={() => fileRef.current?.click()} />
        <SourceCard icon={<FileText className="h-6 w-6" />} title="CSV / Excel" subtitle="Any contact export" action="Upload" onClick={() => fileRef.current?.click()} />
        <SourceCard
          icon={<Users className="h-6 w-6" />}
          title="Eventbrite"
          subtitle="Private token"
          action="Connect"
          onClick={() => setShowEb(true)}
        />
        <SourceCard icon={<Link2 className="h-6 w-6" />} title="Google Sheets" subtitle="Coming soon" action="Connect" disabled />
        <SourceCard icon={<Calendar className="h-6 w-6" />} title="Resident Advisor" subtitle="Coming soon" action="Connect" disabled />
      </div>

      {/* Eventbrite opens in its own modal ON TOP of the wizard so the import
          options never push content below the fold. */}
      {showEb && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: 'rgba(20,16,12,0.45)' }}
          onClick={() => setShowEb(false)}
        >
          <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <EventbritePanel
              onImport={(rows) => {
                setShowEb(false);
                onEventbrite(rows);
              }}
              onCancel={() => setShowEb(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function EventbritePanel({
  onImport,
  onCancel,
}: {
  onImport: (rows: Array<{ name: string; email: string; phone: string }>) => void;
  onCancel?: () => void;
}) {
  const [token, setToken] = useState('');
  const [eventId, setEventId] = useState('');
  const [events, setEvents] = useState<Array<{ id: string; name: string }> | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualFallback, setManualFallback] = useState(false);
  const loadedFor = useRef('');

  // Load the account's events automatically once a token is entered.
  const loadEvents = async (t: string) => {
    const tok = t.trim();
    if (!tok || loadedFor.current === tok) return;
    loadedFor.current = tok;
    setLoadingEvents(true);
    setError(null);
    setManualFallback(false);
    try {
      const res = await fetch('/api/eventbrite/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tok }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load events');
      const evs = (data.events || []).map((e: { id: string; name?: { text?: string } | string }) => ({
        id: e.id,
        name: typeof e.name === 'string' ? e.name : e.name?.text || 'Untitled event',
      }));
      setEvents(evs);
      setEventId(evs[0]?.id ?? '');
    } catch (e) {
      // Listing failed (e.g. token has no org) — fall back to a manual Event ID.
      setError(`${(e as Error).message}. Enter an Event ID manually.`);
      setManualFallback(true);
    } finally {
      setLoadingEvents(false);
    }
  };

  const importAttendees = async () => {
    if (!token.trim() || !eventId.trim()) return;
    setImporting(true);
    setError(null);
    try {
      const res = await fetch('/api/eventbrite/attendees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), eventId: eventId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load attendees');
      const rows = (data.attendees || []).map((a: { profile?: { name?: string; email?: string; cell_phone?: string }; name?: string; email?: string }) => ({
        name: a.profile?.name || a.name || '',
        email: a.profile?.email || a.email || '',
        phone: a.profile?.cell_phone || '',
      }));
      if (rows.length === 0) throw new Error('No attendees with contact info found for this event.');
      onImport(rows);
    } catch (e) {
      setError((e as Error).message);
      setImporting(false);
    }
  };

  const inputStyle = { borderColor: T.border, color: T.ink, backgroundColor: T.panel } as const;
  const showDropdown = !!events && events.length > 0 && !manualFallback;

  return (
    <div className="rounded-2xl border p-6 shadow-2xl" style={{ borderColor: T.border, backgroundColor: T.panel }}>
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-lg font-bold" style={{ color: T.heading }}>
          Import from Eventbrite
        </h3>
        {onCancel && (
          <button type="button" onClick={onCancel} className="p-1.5 rounded-lg hover:bg-black/5 -mt-1 -mr-1" aria-label="Close">
            <X className="h-5 w-5" style={{ color: T.subtext }} />
          </button>
        )}
      </div>
      <p className="text-xs mb-5" style={{ color: T.subtext }}>
        Paste your Eventbrite <strong>private token</strong> (Account Settings → Developer links → API
        keys). We'll load your events automatically.
      </p>

      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.subtext }}>
        Private token
      </label>
      <input
        value={token}
        onChange={(e) => {
          setToken(e.target.value);
          setEvents(null);
          setManualFallback(false);
          loadedFor.current = '';
        }}
        onBlur={() => loadEvents(token)}
        onKeyDown={(e) => e.key === 'Enter' && loadEvents(token)}
        placeholder="e.g. XXXXXXXXXXXXXXXXXXXX"
        className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none mt-1 mb-5"
        style={inputStyle}
      />

      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.subtext }}>
        Event
      </label>
      <div className="mt-1 mb-5">
        {loadingEvents ? (
          <div className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm" style={{ ...inputStyle, color: T.subtext }}>
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: T.accent }} /> Loading your events…
          </div>
        ) : showDropdown ? (
          <select value={eventId} onChange={(e) => setEventId(e.target.value)} className="w-full rounded-xl border px-4 py-3 text-sm" style={inputStyle}>
            {events!.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        ) : manualFallback ? (
          <input
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            placeholder="Event ID, e.g. 1234567890"
            className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none"
            style={inputStyle}
          />
        ) : (
          <div className="rounded-xl border px-4 py-3 text-sm" style={{ ...inputStyle, color: T.subtext }}>
            Enter your token above to load events.
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm mb-4" style={{ color: '#B0392B' }}>
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border-2 px-6 py-3 text-sm font-semibold"
          style={{ borderColor: T.border, color: T.ink }}
        >
          Cancel
        </button>
        <ProcessButton
          onClick={importAttendees}
          loading={importing}
          disabled={!token.trim() || !eventId.trim()}
          className="flex-1"
        >
          Import attendees
        </ProcessButton>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 2 — Review                                                           */
/* -------------------------------------------------------------------------- */

function Flag({ code }: { code: string | null }) {
  if (!code) return <span style={{ color: T.subtext }}>—</span>;
  const flag = code.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{flag}</span>
      <span style={{ color: T.ink }}>{code}</span>
    </span>
  );
}

function ReviewStep({ parseResult, onNext, onBack }: { parseResult: ParseResult | null; onNext: () => void; onBack: () => void }) {
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('all');
  const rows = parseResult?.rows.filter((r) => r.selected) ?? [];
  const countries = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => r.country && s.add(r.country));
    return [...s].sort();
  }, [rows]);
  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    if (country !== 'all' && r.country !== country) return false;
    if (q && !`${r.name} ${r.email}`.toLowerCase().includes(q)) return false;
    return true;
  });
  const merged = parseResult?.autoDeselected.duplicates ?? 0;
  const selStyle = { borderColor: T.border, color: T.ink, backgroundColor: T.panel } as const;

  return (
    <div>
      <ProcessStepHeader title="Review your contacts." />
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: T.subtext }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm focus:outline-none" style={selStyle} />
        </div>
        <select value={country} onChange={(e) => setCountry(e.target.value)} className="rounded-xl border px-4 py-2.5 text-sm" style={selStyle}>
          <option value="all">All countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span className="ml-auto rounded-full px-4 py-2.5 text-sm font-semibold text-white whitespace-nowrap" style={{ backgroundColor: T.heading }}>
          {rows.length.toLocaleString()} contacts · {merged.toLocaleString()} duplicates merged
        </span>
      </div>
      <div className="rounded-2xl border overflow-hidden mb-10" style={{ borderColor: T.border, backgroundColor: T.panel }}>
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0" style={{ backgroundColor: '#FAF7F1' }}>
              <tr style={{ color: T.subtext }}>
                {['Name', 'Email', 'Phone', 'Country'].map((h) => (
                  <th key={h} className="text-left font-semibold px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 500).map((r) => (
                <tr key={r.id} className="border-t" style={{ borderColor: T.border }}>
                  <td className="px-5 py-3" style={{ color: T.heading }}>
                    {r.name || '—'}
                  </td>
                  <td className="px-5 py-3" style={{ color: T.accent }}>
                    {r.email || '—'}
                  </td>
                  <td className="px-5 py-3" style={{ color: T.ink }}>
                    {r.phone || '—'}
                  </td>
                  <td className="px-5 py-3">
                    <Flag code={r.country || null} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center" style={{ color: T.subtext }}>
                    No contacts match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ProcessButton onClick={onNext}>Looks good — continue</ProcessButton>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 3 — Communities (name + icon + banner + lore + tags)                */
/* -------------------------------------------------------------------------- */

function TagsInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [v, setV] = useState('');
  const add = () => {
    const t = v.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setV('');
  };
  return (
    <div className="rounded-xl border px-3 py-2 flex flex-wrap items-center gap-1.5" style={{ borderColor: T.border, backgroundColor: T.panel }}>
      {tags.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#F1ECE2', color: T.ink }}>
          {t}
          <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} style={{ color: T.subtext }}>
            ×
          </button>
        </span>
      ))}
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        placeholder={tags.length ? '' : 'Add tags (press Enter)'}
        className="flex-1 min-w-[120px] py-1 text-sm focus:outline-none bg-transparent"
        style={{ color: T.ink }}
      />
    </div>
  );
}

function CommunityCard({
  c,
  index,
  canRemove,
  update,
  remove,
}: {
  c: CommunityDraft;
  index: number;
  canRemove: boolean;
  update: (patch: Partial<CommunityDraft>) => void;
  remove: () => void;
}) {
  const iconRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  return (
    <div className="w-full max-w-[440px] rounded-2xl border-2 overflow-hidden" style={{ borderColor: T.border, backgroundColor: T.panel }}>
      {/* Banner + icon */}
      <div className="relative">
        <button
          type="button"
          onClick={() => bannerRef.current?.click()}
          className="w-full h-28 flex items-center justify-center text-sm"
          style={{
            color: T.subtext,
            background: c.bannerPreview ? `center/cover no-repeat url(${c.bannerPreview})` : '#F1ECE2',
          }}
        >
          {!c.bannerPreview && (
            <span className="inline-flex items-center gap-2">
              <ImagePlus className="h-4 w-4" /> Add banner
            </span>
          )}
        </button>
        <input
          ref={bannerRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) update({ bannerFile: f, bannerPreview: URL.createObjectURL(f) });
          }}
        />
        <button
          type="button"
          onClick={() => iconRef.current?.click()}
          className="absolute -bottom-6 left-5 h-14 w-14 rounded-xl border-2 flex items-center justify-center overflow-hidden"
          style={{ borderColor: T.panel, backgroundColor: '#E2D9C9', color: T.ink }}
        >
          {c.iconPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.iconPreview} alt="icon" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
        </button>
        <input
          ref={iconRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) update({ iconFile: f, iconPreview: URL.createObjectURL(f) });
          }}
        />
        {canRemove && (
          <button type="button" onClick={remove} className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 hover:bg-white" style={{ color: T.subtext }}>
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="p-5 pt-8 space-y-3">
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#F1ECE2', color: T.ink }}>
            {index + 1}
          </span>
          <input
            value={c.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="Community name"
            className="flex-1 rounded-xl border px-4 py-3 text-sm focus:outline-none"
            style={{ borderColor: T.border, color: T.ink }}
          />
        </div>
        <textarea
          value={c.lore}
          onChange={(e) => update({ lore: e.target.value })}
          placeholder="Lore / description (optional)"
          rows={2}
          className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none resize-none"
          style={{ borderColor: T.border, color: T.ink }}
        />
        <TagsInput tags={c.tags} onChange={(t) => update({ tags: t })} />
        {c.name.trim() && (
          <p className="text-xs flex items-center gap-1.5" style={{ color: T.subtext }}>
            <Globe className="h-3.5 w-3.5" />
            send.{slugify(c.name)}.kyozo.com
          </p>
        )}
      </div>
    </div>
  );
}

function CommunitiesStep({
  communities,
  setCommunities,
  onNext,
  onBack,
}: {
  communities: CommunityDraft[];
  setCommunities: (c: CommunityDraft[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const update = (id: string, patch: Partial<CommunityDraft>) =>
    setCommunities(communities.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const canContinue = communities.some((c) => c.name.trim());

  return (
    <div>
      <ProcessStepHeader title="Tell us what you're building." subtitle="Name your communities, add a look, and they each get an email subdomain." />
      <div className="flex flex-wrap justify-center gap-5 mb-8">
        {communities.map((c, idx) => (
          <CommunityCard
            key={c.id}
            c={c}
            index={idx}
            canRemove={communities.length > 1}
            update={(patch) => update(c.id, patch)}
            remove={() => setCommunities(communities.filter((x) => x.id !== c.id))}
          />
        ))}
      </div>
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setCommunities([...communities, emptyCommunity(communities.length + 1)])}
          className="inline-flex items-center gap-2 rounded-xl border-2 px-6 py-3 text-sm font-semibold"
          style={{ borderColor: T.border, color: T.ink }}
        >
          <Plus className="h-4 w-4" /> Add community
        </button>
        <ProcessButton onClick={onNext} disabled={!canContinue}>
          Continue
        </ProcessButton>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 4 — Tag (with full member list)                                      */
/* -------------------------------------------------------------------------- */

function TagStep({
  parseResult,
  setParseResult,
  tags,
  setTags,
  search,
  setSearch,
  country,
  setCountry,
  onNext,
  onBack,
}: {
  parseResult: ParseResult | null;
  setParseResult: (pr: ParseResult) => void;
  tags: string[];
  setTags: (t: string[]) => void;
  search: string;
  setSearch: (v: string) => void;
  country: string;
  setCountry: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const allRows = parseResult?.rows ?? [];
  const countries = useMemo(() => {
    const s = new Set<string>();
    allRows.forEach((r) => r.selected && r.country && s.add(r.country));
    return [...s].sort();
  }, [allRows]);

  const visible = allRows.filter((r) => {
    const q = search.trim().toLowerCase();
    if (country !== 'all' && r.country !== country) return false;
    if (q && !`${r.name} ${r.email}`.toLowerCase().includes(q)) return false;
    return true;
  });
  const selectedCount = visible.filter((r) => r.selected).length;

  const toggle = (id: string) => {
    if (!parseResult) return;
    const rows = parseResult.rows.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r));
    setParseResult({ ...parseResult, rows, selectedCount: rows.filter((r) => r.selected).length });
  };

  const selStyle = { borderColor: T.border, color: T.ink, backgroundColor: T.panel } as const;

  return (
    <div>
      <ProcessStepHeader title="Tag your audience." subtitle="Add one or more tags, then review who's being added." />

      {/* Tags — dedicated, multi-tag chip input */}
      <div className="mb-6">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.subtext }}>
          Tags
        </label>
        <div className="mt-1.5">
          <TagsInput tags={tags} onChange={setTags} />
        </div>
        <p className="text-[11.5px] mt-1.5" style={{ color: T.subtext }}>
          Type a tag and press Enter. Every selected contact gets these tags in every community.
        </p>
      </div>

      {/* Member filter */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: T.subtext }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email…" className="w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm focus:outline-none" style={selStyle} />
        </div>
        <select value={country} onChange={(e) => setCountry(e.target.value)} className="rounded-xl border px-4 py-2.5 text-sm" style={selStyle}>
          <option value="all">All countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm mb-3" style={{ color: T.subtext }}>
        <strong style={{ color: T.heading }}>{selectedCount.toLocaleString()}</strong> of {visible.length.toLocaleString()} shown will be tagged & added to every community. Untick anyone to exclude them.
      </p>

      <div className="rounded-2xl border overflow-hidden mb-8" style={{ borderColor: T.border, backgroundColor: T.panel }}>
        <div className="max-h-[360px] overflow-auto divide-y" style={{ borderColor: T.border }}>
          {visible.slice(0, 1000).map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => toggle(r.id)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-black/[0.02]"
            >
              <span
                className="h-5 w-5 rounded flex items-center justify-center flex-shrink-0"
                style={{
                  background: r.selected ? T.accent : 'transparent',
                  border: `1.5px solid ${r.selected ? T.accent : '#D8CBB6'}`,
                }}
              >
                {r.selected && <Check className="h-3 w-3 text-white" />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium truncate" style={{ color: T.heading }}>
                  {r.name || '—'}
                </span>
                <span className="block text-xs truncate" style={{ color: T.subtext }}>
                  {r.email || r.phone || '—'}
                </span>
              </span>
              <span className="text-xs flex-shrink-0">
                <Flag code={r.country || null} />
              </span>
            </button>
          ))}
          {visible.length === 0 && (
            <div className="px-4 py-10 text-center text-sm" style={{ color: T.subtext }}>
              No contacts match these filters.
            </div>
          )}
        </div>
      </div>

      <ProcessButton onClick={onNext} disabled={tags.length === 0 || selectedCount === 0}>
        Continue
      </ProcessButton>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 5 — Confirm                                                          */
/* -------------------------------------------------------------------------- */

function ConfirmStep({
  communities,
  memberCount,
  tags,
  onNext,
  onBack,
}: {
  communities: CommunityDraft[];
  memberCount: number;
  tags: string[];
  onNext: () => void;
  onBack: () => void;
}) {
  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: T.border }}>
      <span className="text-sm" style={{ color: T.subtext }}>
        {label}
      </span>
      <span className="text-sm font-semibold text-right" style={{ color: T.heading }}>
        {value}
      </span>
    </div>
  );
  return (
    <div>
      <ProcessStepHeader title="Confirm and create." subtitle="Here's what we'll set up." />
      <div className="rounded-2xl border p-6 max-w-xl mb-10" style={{ borderColor: T.border, backgroundColor: T.panel }}>
        <Row label="Contacts to add" value={memberCount.toLocaleString()} />
        <Row label="Communities" value={communities.map((c) => c.name).join(', ') || '—'} />
        <Row label="Email subdomains" value={`${communities.length} (send.<handle>.kyozo.com)`} />
        <Row label={tags.length === 1 ? 'Tag' : 'Tags'} value={tags.join(', ') || '—'} />
      </div>
      <ProcessButton onClick={onNext}>Create communities & import</ProcessButton>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 6 — Create                                                           */
/* -------------------------------------------------------------------------- */

const STATUS_LABEL: Record<CreateStatus, string> = {
  pending: 'Waiting…',
  creating: 'Creating community…',
  uploading: 'Uploading icon & banner…',
  subdomain: 'Setting up email subdomain…',
  importing: 'Importing contacts…',
  done: 'Done',
  error: 'Failed',
};

function CreateStep({ progress, run, done, onNext }: { progress: CreateProgress[]; run: () => void; done: boolean; onNext: () => void }) {
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <ProcessStepHeader title="Setting things up." subtitle="Creating each community, its branding, email subdomain, and importing your contacts." />
      <div className="space-y-3">
        {progress.map((p, i) => (
          <div key={i} className="rounded-2xl border p-5 flex items-center gap-4" style={{ borderColor: T.border, backgroundColor: T.panel }}>
            <div className="flex-1">
              <p className="font-semibold" style={{ color: T.heading }}>
                {p.name}
              </p>
              <p className="text-sm flex items-center gap-1.5 flex-wrap" style={{ color: p.status === 'error' ? '#B0392B' : T.subtext }}>
                {p.status === 'error' ? p.error : STATUS_LABEL[p.status]}
                {p.status === 'done' && p.handle && (
                  <span className="inline-flex items-center gap-1">
                    · <Globe className="h-3 w-3" /> send.{p.handle}.kyozo.com
                    {p.subdomainOk === false && <span style={{ color: '#A16207' }}> (subdomain pending)</span>}
                    {typeof p.imported === 'number' && <span> · {p.imported.toLocaleString()} imported</span>}
                  </span>
                )}
              </p>
            </div>
            {p.status === 'done' ? (
              <span className="h-7 w-7 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E7F2EC' }}>
                <Check className="h-4 w-4" style={{ color: '#3B8C5A' }} />
              </span>
            ) : p.status === 'error' ? (
              <X className="h-5 w-5" style={{ color: '#B0392B' }} />
            ) : (
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: T.accent }} />
            )}
          </div>
        ))}
      </div>
      {done && (
        <div className="mt-10">
          <ProcessButton onClick={onNext}>Continue</ProcessButton>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 7 — Done                                                             */
/* -------------------------------------------------------------------------- */

function DoneStep({ handles, communityCount, memberCount, onGo }: { handles: string[]; communityCount: number; memberCount: number; onGo: () => void }) {
  const n = handles.length || communityCount;
  return (
    <div className="text-center py-16">
      <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-8" style={{ backgroundColor: T.accent }}>
        <Sparkles className="h-7 w-7 text-white" />
      </div>
      <h2 className="font-serif text-5xl mb-4" style={{ color: T.heading }}>
        You're all set.
      </h2>
      <p className="text-lg mb-10" style={{ color: T.subtext }}>
        {n} communit{n === 1 ? 'y' : 'ies'} created · {memberCount.toLocaleString()} contacts imported.
      </p>
      <ProcessButton onClick={onGo}>Go to your community</ProcessButton>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

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
