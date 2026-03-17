'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { collection, query, where, getDocs, addDoc, setDoc, doc, serverTimestamp, increment, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Community } from '@/lib/types';
import {
  Globe, Lock, Calendar, Music, Upload, Users, Plus, X, ChevronRight,
  ChevronLeft, Check, FileSpreadsheet, FileText, AlertCircle, Loader2,
  Download, Trash2, Edit2, Save
} from 'lucide-react';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { PageLoadingSkeleton } from '@/components/community/page-loading-skeleton';
import { useToast } from '@/hooks/use-toast';

// ── Types ─────────────────────────────────────────────────────
type ImportSource = 'eventbrite' | 'csv' | 'xlsx' | 'manual';
type WizardStep = 'source' | 'configure' | 'preview' | 'done';

interface ImportMember {
  _id: string;
  name: string;
  email: string;
  phone: string;
  tags: string;
  notes: string;
  [key: string]: string;
}

// ── Simple CSV parser ─────────────────────────────────────────
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  for (const line of lines) {
    const cols: string[] = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    cols.push(cur.trim());
    rows.push(cols);
  }
  return rows;
}

function rowsToMembers(rows: string[][]): ImportMember[] {
  if (rows.length < 2) return [];
  const headers = rows[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, '_'));
  const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('first'));
  const emailIdx = headers.findIndex(h => h.includes('email'));
  const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('mobile'));
  const tagsIdx = headers.findIndex(h => h.includes('tag'));
  const notesIdx = headers.findIndex(h => h.includes('note') || h.includes('comment'));
  return rows.slice(1).map((row, i) => ({
    _id: `import-${i}`,
    name: nameIdx >= 0 ? row[nameIdx] || '' : '',
    email: emailIdx >= 0 ? row[emailIdx] || '' : '',
    phone: phoneIdx >= 0 ? row[phoneIdx] || '' : '',
    tags: tagsIdx >= 0 ? row[tagsIdx] || '' : '',
    notes: notesIdx >= 0 ? row[notesIdx] || '' : '',
  }));
}

// ── Step indicator ────────────────────────────────────────────
const STEPS: { id: WizardStep; label: string }[] = [
  { id: 'source', label: 'Choose Source' },
  { id: 'configure', label: 'Configure' },
  { id: 'preview', label: 'Preview & Edit' },
  { id: 'done', label: 'Import' },
];

function StepIndicator({ current }: { current: WizardStep }) {
  const idx = STEPS.findIndex(s => s.id === current);
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              i < idx ? 'text-white' : i === idx ? 'text-white' : 'text-gray-400'
            }`} style={{ backgroundColor: i <= idx ? '#5B4A3A' : '#E8DFD1' }}>
              {i < idx ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className="text-xs whitespace-nowrap hidden sm:block" style={{ color: i <= idx ? '#5B4A3A' : '#B0A090' }}>{step.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="w-16 h-0.5 mb-5 mx-1" style={{ backgroundColor: i < idx ? '#5B4A3A' : '#E8DFD1' }} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function IntegrationsPage() {
  const params = useParams();
  const handle = params.handle as string;
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);

  // Wizard state
  const [step, setStep] = useState<WizardStep>('source');
  const [source, setSource] = useState<ImportSource | null>(null);
  const [members, setMembers] = useState<ImportMember[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Eventbrite config
  const [ebToken, setEbToken] = useState('');
  const [ebEventId, setEbEventId] = useState('');
  const [ebLoading, setEbLoading] = useState(false);
  const [ebError, setEbError] = useState('');

  // Manual member form
  const [manualForm, setManualForm] = useState({ name: '', email: '', phone: '', tags: '' });

  // Import progress
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importDone, setImportDone] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const q = query(collection(db, 'communities'), where('handle', '==', handle));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const d = snap.docs[0];
          setCommunity({ communityId: d.id, ...d.data() } as Community);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCommunity();
  }, [handle]);

  // ── File upload handler ────────────────────────────────────
  const handleFileUpload = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'csv' || ext === 'tsv') {
      const text = await file.text();
      const rows = parseCSV(text);
      setMembers(rowsToMembers(rows));
      setStep('preview');
    } else if (ext === 'xlsx' || ext === 'xls') {
      try {
        const XLSX = await import('xlsx');
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1 }) as string[][];
        setMembers(rowsToMembers(rows));
        setStep('preview');
      } catch (e) {
        toast({ title: 'Error', description: 'Could not parse Excel file. Try exporting as CSV.', variant: 'destructive' });
      }
    }
  }, [toast]);

  // ── Eventbrite fetch ───────────────────────────────────────
  const fetchEventbrite = async () => {
    if (!ebToken || !ebEventId) return;
    setEbLoading(true);
    setEbError('');
    try {
      const res = await fetch('/api/eventbrite/attendees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: ebToken, eventId: ebEventId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      const mapped: ImportMember[] = (data.attendees || []).map((a: any, i: number) => ({
        _id: `eb-${i}`,
        name: `${a.profile?.first_name || ''} ${a.profile?.last_name || ''}`.trim(),
        email: a.profile?.email || '',
        phone: a.profile?.cell_phone || '',
        tags: 'eventbrite',
        notes: a.ticket_class_name || '',
      }));
      setMembers(mapped);
      setStep('preview');
    } catch (e: any) {
      setEbError(e.message || 'Failed to fetch attendees');
    } finally {
      setEbLoading(false);
    }
  };

  // ── Manual add member ──────────────────────────────────────
  const addManualMember = () => {
    if (!manualForm.name && !manualForm.email) return;
    setMembers(prev => [...prev, { _id: `manual-${Date.now()}`, ...manualForm, notes: '' }]);
    setManualForm({ name: '', email: '', phone: '', tags: '' });
  };

  // ── Inline edit ────────────────────────────────────────────
  const updateMember = (id: string, field: string, value: string) => {
    setMembers(prev => prev.map(m => m._id === id ? { ...m, [field]: value } : m));
  };

  const deleteMember = (id: string) => {
    setMembers(prev => prev.filter(m => m._id !== id));
  };

  // ── Import to Firestore ────────────────────────────────────
  const runImport = async () => {
    if (!community || members.length === 0) return;
    setImporting(true);
    setImportProgress(0);
    setImportErrors([]);
    const errors: string[] = [];

    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      try {
        const tags = m.tags ? m.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
        await addDoc(collection(db, 'communityMembers'), {
          communityId: community.communityId,
          userId: `imported-${Date.now()}-${i}`,
          role: 'member',
          status: 'active',
          source: 'import',
          importedAt: serverTimestamp(),
          joinedAt: serverTimestamp(),
          tags,
          userDetails: {
            displayName: m.name,
            email: m.email,
            phone: m.phone,
            avatarUrl: null,
          },
        });
      } catch (e: any) {
        errors.push(`Row ${i + 1} (${m.email || m.name}): ${e.message}`);
      }
      setImportProgress(Math.round(((i + 1) / members.length) * 100));
    }

    // Update member count
    try {
      const successful = members.length - errors.length;
      await updateDoc(doc(db, 'communities', community.communityId), {
        memberCount: increment(successful),
      });
    } catch (_) {}

    setImportErrors(errors);
    setImportDone(true);
    setImporting(false);
    setStep('done');
  };

  // ── Render ─────────────────────────────────────────────────
  if (loading) return <PageLoadingSkeleton showMemberList={true} />;
  if (!community) return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--page-bg-color)' }}>
      <div className="p-8"><div className="rounded-2xl p-8" style={{ backgroundColor: 'var(--page-content-bg)', border: '2px solid var(--page-content-border)' }}><p>Community not found</p></div></div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--page-bg-color)' }}>
      <div className="p-8 flex-1 overflow-auto">
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--page-content-bg)', border: '2px solid var(--page-content-border)' }}>
          <Banner
            backgroundImage={community.communityBackgroundImage}
            iconImage={community.communityProfileImage}
            title={community.name}
            locationExtra={
              <span className="flex items-center gap-1 text-sm text-white/90">
                {(community as any).visibility === 'private' ? <><Lock className="h-3.5 w-3.5" /> Private</> : <><Globe className="h-3.5 w-3.5" /> Public</>}
              </span>
            }
            subtitle={community.tagline || (community as any).mantras}
            tags={(community as any).tags || []}
            height="16rem"
          />

          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold" style={{ color: '#5B4A3A' }}>Import Members</h2>
              <p className="text-sm mt-1" style={{ color: '#8B7355' }}>Import contacts from Eventbrite, CSV, Excel, or add them manually.</p>
            </div>

            <StepIndicator current={step} />

            {/* ── Step 1: Source ── */}
            {step === 'source' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl">
                {([
                  { id: 'eventbrite', label: 'Eventbrite', icon: <Calendar className="h-7 w-7" />, color: '#E07B39', bg: '#FFF3E8', desc: 'Import event attendees' },
                  { id: 'csv', label: 'CSV File', icon: <FileText className="h-7 w-7" />, color: '#059669', bg: '#ECFDF5', desc: 'Upload a .csv file' },
                  { id: 'xlsx', label: 'Excel / XLS', icon: <FileSpreadsheet className="h-7 w-7" />, color: '#1D6F42', bg: '#F0FDF4', desc: 'Upload .xlsx or .xls' },
                  { id: 'manual', label: 'Manual Entry', icon: <Plus className="h-7 w-7" />, color: '#7C3AED', bg: '#F5F3FF', desc: 'Add one by one' },
                ] as const).map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setSource(s.id as ImportSource); setStep('configure'); }}
                    className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 text-center transition-all hover:shadow-md hover:-translate-y-0.5"
                    style={{ borderColor: '#E8DFD1', backgroundColor: 'white' }}
                  >
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.bg, color: s.color }}>{s.icon}</div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: '#3D2E1E' }}>{s.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#8B7355' }}>{s.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* ── Step 2: Configure ── */}
            {step === 'configure' && source === 'eventbrite' && (
              <div className="max-w-md space-y-4">
                <h3 className="font-semibold" style={{ color: '#3D2E1E' }}>Connect Eventbrite</h3>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: '#8B7355' }}>API Token</label>
                  <input value={ebToken} onChange={e => setEbToken(e.target.value)} placeholder="Paste your Eventbrite private token..." className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none" style={{ borderColor: '#E8DFD1' }} />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: '#8B7355' }}>Event ID</label>
                  <input value={ebEventId} onChange={e => setEbEventId(e.target.value)} placeholder="e.g. 123456789" className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none" style={{ borderColor: '#E8DFD1' }} />
                </div>
                {ebError && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{ebError}</p>}
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setStep('source')}>Back</Button>
                  <Button size="sm" onClick={fetchEventbrite} disabled={ebLoading || !ebToken || !ebEventId} style={{ backgroundColor: '#5B4A3A', color: 'white' }}>
                    {ebLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Fetching...</> : 'Fetch Attendees'}
                  </Button>
                </div>
              </div>
            )}

            {step === 'configure' && (source === 'csv' || source === 'xlsx') && (
              <div className="max-w-md space-y-4">
                <h3 className="font-semibold" style={{ color: '#3D2E1E' }}>Upload {source === 'csv' ? 'CSV' : 'Excel'} File</h3>
                <p className="text-sm" style={{ color: '#8B7355' }}>File should have columns: Name, Email, Phone, Tags (optional)</p>
                <div
                  className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors hover:bg-gray-50"
                  style={{ borderColor: '#E8DFD1' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2" style={{ color: '#B0A090' }} />
                  <p className="text-sm font-medium" style={{ color: '#5B4A3A' }}>Click to browse or drag & drop</p>
                  <p className="text-xs mt-1" style={{ color: '#8B7355' }}>{source === 'csv' ? '.csv, .tsv' : '.xlsx, .xls'} files accepted</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={source === 'csv' ? '.csv,.tsv' : '.xlsx,.xls'}
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
                  />
                </div>
                <Button variant="outline" size="sm" onClick={() => setStep('source')}>Back</Button>
              </div>
            )}

            {step === 'configure' && source === 'manual' && (
              <div className="max-w-2xl space-y-4">
                <h3 className="font-semibold" style={{ color: '#3D2E1E' }}>Add Members Manually</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(['name', 'email', 'phone', 'tags'] as const).map(field => (
                    <div key={field}>
                      <label className="text-xs font-medium block mb-1 capitalize" style={{ color: '#8B7355' }}>{field}</label>
                      <input
                        value={manualForm[field]}
                        onChange={e => setManualForm(p => ({ ...p, [field]: e.target.value }))}
                        placeholder={field === 'tags' ? 'tag1, tag2' : field}
                        className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                        style={{ borderColor: '#E8DFD1' }}
                        onKeyDown={e => { if (e.key === 'Enter') addManualMember(); }}
                      />
                    </div>
                  ))}
                </div>
                <Button size="sm" onClick={addManualMember} style={{ backgroundColor: '#5B4A3A', color: 'white' }}>
                  <Plus className="h-4 w-4 mr-1" />Add Member
                </Button>

                {members.length > 0 && (
                  <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                    {members.map(m => (
                      <div key={m._id} className="flex items-center gap-3 p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--page-bg-color)', border: '1px solid #E8DFD1' }}>
                        <span className="flex-1 font-medium" style={{ color: '#3D2E1E' }}>{m.name || '—'}</span>
                        <span style={{ color: '#8B7355' }}>{m.email}</span>
                        <span style={{ color: '#8B7355' }}>{m.phone}</span>
                        <button onClick={() => deleteMember(m._id)}><X className="h-4 w-4 text-red-400 hover:text-red-600" /></button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setStep('source')}>Back</Button>
                  <Button size="sm" disabled={members.length === 0} onClick={() => setStep('preview')} style={{ backgroundColor: '#5B4A3A', color: 'white' }}>
                    Preview {members.length > 0 ? `(${members.length})` : ''} <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 3: Preview & Edit ── */}
            {step === 'preview' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold" style={{ color: '#3D2E1E' }}>Preview Import</h3>
                    <p className="text-sm" style={{ color: '#8B7355' }}>{members.length} members ready — click any cell to edit before importing.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setStep('configure')}><ChevronLeft className="h-4 w-4 mr-1" />Back</Button>
                    <Button size="sm" onClick={runImport} style={{ backgroundColor: '#5B4A3A', color: 'white' }}>
                      <Download className="h-4 w-4 mr-1" />Import {members.length} Members
                    </Button>
                  </div>
                </div>

                {/* Editable grid */}
                <div className="overflow-auto rounded-xl border" style={{ borderColor: '#E8DFD1', maxHeight: '60vh' }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: '#F5F0EB' }}>
                        <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wide" style={{ color: '#8B7355', width: 36 }}>#</th>
                        {['name', 'email', 'phone', 'tags', 'notes'].map(col => (
                          <th key={col} className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wide" style={{ color: '#8B7355' }}>{col}</th>
                        ))}
                        <th className="px-4 py-2.5 w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m, i) => (
                        <tr key={m._id} className="border-t hover:bg-amber-50/30" style={{ borderColor: '#F0EBE3' }}>
                          <td className="px-4 py-2 text-xs" style={{ color: '#B0A090' }}>{i + 1}</td>
                          {['name', 'email', 'phone', 'tags', 'notes'].map(col => (
                            <td key={col} className="px-2 py-1.5">
                              {editingId === m._id ? (
                                <input
                                  value={m[col]}
                                  onChange={e => updateMember(m._id, col, e.target.value)}
                                  className="w-full px-2 py-1 rounded border text-sm focus:outline-none"
                                  style={{ borderColor: '#E8DFD1' }}
                                  placeholder={col === 'tags' ? 'tag1, tag2' : col}
                                />
                              ) : (
                                <span className="px-2" style={{ color: m[col] ? '#3D2E1E' : '#C0B0A0' }}>{m[col] || <span className="italic text-xs" style={{ color: '#C0B0A0' }}>empty</span>}</span>
                              )}
                            </td>
                          ))}
                          <td className="px-2 py-1.5">
                            <div className="flex items-center gap-1">
                              <button onClick={() => setEditingId(editingId === m._id ? null : m._id)}>
                                {editingId === m._id ? <Save className="h-3.5 w-3.5 text-green-600" /> : <Edit2 className="h-3.5 w-3.5" style={{ color: '#B0A090' }} />}
                              </button>
                              <button onClick={() => deleteMember(m._id)}><Trash2 className="h-3.5 w-3.5 text-red-400 hover:text-red-600" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Step 4: Done ── */}
            {step === 'done' && (
              <div className="max-w-md text-center py-10 mx-auto">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#ECFDF5' }}>
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: '#3D2E1E' }}>Import Complete!</h3>
                <p className="text-sm" style={{ color: '#8B7355' }}>
                  {members.length - importErrors.length} of {members.length} members imported successfully.
                </p>
                {importErrors.length > 0 && (
                  <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-left">
                    <p className="text-xs font-semibold text-red-700 mb-1">{importErrors.length} errors:</p>
                    {importErrors.slice(0, 5).map((e, i) => <p key={i} className="text-xs text-red-600">{e}</p>)}
                  </div>
                )}
                <div className="flex gap-3 justify-center mt-6">
                  <Button variant="outline" size="sm" onClick={() => { setStep('source'); setSource(null); setMembers([]); setImportDone(false); }}>Import More</Button>
                  <Button size="sm" onClick={() => window.location.href = `/${handle}/audience`} style={{ backgroundColor: '#5B4A3A', color: 'white' }}>
                    <Users className="h-4 w-4 mr-1" />View Audience
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Import Progress Modal ── */}
      {importing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4" style={{ color: '#5B4A3A' }} />
            <h3 className="font-bold text-lg mb-1" style={{ color: '#3D2E1E' }}>Importing Members...</h3>
            <p className="text-sm mb-4" style={{ color: '#8B7355' }}>Please wait, do not close this window.</p>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full transition-all duration-300"
                style={{ width: `${importProgress}%`, backgroundColor: '#5B4A3A' }}
              />
            </div>
            <p className="text-sm font-semibold mt-2" style={{ color: '#5B4A3A' }}>{importProgress}%</p>
          </div>
        </div>
      )}
    </div>
  );
}
