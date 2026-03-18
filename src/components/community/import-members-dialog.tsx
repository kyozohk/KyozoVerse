'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Calendar, Upload, Plus, X, ChevronLeft, Check,
  FileSpreadsheet, FileText, AlertCircle, Loader2,
  Download, Trash2, Edit2, Save, Zap, Users,
} from 'lucide-react';
import { type Community } from '@/lib/types';
import { addDoc, collection, serverTimestamp, increment, updateDoc, doc, query, where, getDocs, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { communityAuth } from '@/firebase/community-auth';
import { useToast } from '@/hooks/use-toast';

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

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  for (const line of text.split(/\r?\n/).filter(l => l.trim())) {
    const cols: string[] = []; let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; } else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; } else { cur += ch; }
    }
    cols.push(cur.trim()); rows.push(cols);
  }
  return rows;
}

function rowsToMembers(rows: string[][]): ImportMember[] {
  if (rows.length < 2) return [];
  const h = rows[0].map(x => x.toLowerCase().replace(/[^a-z0-9]/g, '_'));
  const ni = h.findIndex(x => x.includes('name') || x.includes('first'));
  const ei = h.findIndex(x => x.includes('email'));
  const pi = h.findIndex(x => x.includes('phone') || x.includes('mobile'));
  const ti = h.findIndex(x => x.includes('tag'));
  const oi = h.findIndex(x => x.includes('note') || x.includes('comment'));
  return rows.slice(1).map((r, i) => ({
    _id: `imp-${i}`, name: ni >= 0 ? r[ni] || '' : '', email: ei >= 0 ? r[ei] || '' : '',
    phone: pi >= 0 ? r[pi] || '' : '', tags: ti >= 0 ? r[ti] || '' : '', notes: oi >= 0 ? r[oi] || '' : '',
  }));
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

  const handleFileUpload = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'csv' || ext === 'tsv') {
      setPendingMembers(rowsToMembers(parseCSV(await file.text())));
      setStep('preview');
    } else if (ext === 'xlsx' || ext === 'xls') {
      try {
        const XLSX = await import('xlsx');
        const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
        setPendingMembers(rowsToMembers(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }) as string[][]));
        setStep('preview');
      } catch { toast({ title: 'Error', description: 'Could not parse Excel file.', variant: 'destructive' }); }
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
      setPendingMembers((data.attendees || []).map((a: any, i: number) => ({
        _id: `eb-${i}`, name: `${a.profile?.first_name || ''} ${a.profile?.last_name || ''}`.trim(),
        email: a.profile?.email || '', phone: a.profile?.cell_phone || '', tags: 'eventbrite', notes: a.ticket_class_name || '',
      })));
      setStep('preview');
    } catch (e: any) { setEbError(e.message || 'Failed'); }
    finally { setEbLoading(false); }
  };

  const addManualMember = () => {
    if (!manualForm.name && !manualForm.email) return;
    setPendingMembers(p => [...p, { _id: `m-${Date.now()}`, ...manualForm, notes: '' }]);
    setManualForm({ name: '', email: '', phone: '', tags: '' });
  };

  const runImport = async () => {
    if (!community?.communityId || pendingMembers.length === 0) return;
    setStep('importing'); setImportProgress(0);
    let successCount = 0; const errors: string[] = [];

    for (let i = 0; i < pendingMembers.length; i++) {
      const m = pendingMembers[i];
      try {
        let ph = m.phone?.trim().replace(/\s+/g, '') || '';
        if (ph && !ph.startsWith('+')) ph = '+' + ph;
        let userId: string;
        const snap = await getDocs(query(collection(db, 'users'), where('email', '==', m.email)));
        if (!snap.empty) {
          userId = snap.docs[0].id;
        } else if (m.email?.includes('@')) {
          try {
            const cred = await createUserWithEmailAndPassword(communityAuth, m.email, Math.random().toString(36).slice(-10));
            userId = cred.user.uid;
            await setDoc(doc(db, 'users', userId), { userId, displayName: m.name, email: m.email, phone: ph, phoneNumber: ph, wa_id: ph.replace(/\+/g, ''), createdAt: serverTimestamp() });
          } catch { userId = `imported-${Date.now()}-${i}`; await setDoc(doc(db, 'users', userId), { userId, displayName: m.name, email: m.email, phone: ph, createdAt: serverTimestamp() }); }
        } else { userId = `imported-${Date.now()}-${i}`; }
        await addDoc(collection(db, 'communityMembers'), {
          userId, communityId: community.communityId, role: 'member', status: 'active',
          source: 'import', importedAt: serverTimestamp(), joinedAt: serverTimestamp(),
          tags: m.tags ? m.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          userDetails: { displayName: m.name, email: m.email, phone: ph, avatarUrl: null },
        });
        successCount++;
      } catch (e: any) { errors.push(`${m.email || m.name}: ${e.message}`); }
      setImportProgress(Math.round(((i + 1) / pendingMembers.length) * 100));
    }
    try { await updateDoc(doc(db, 'communities', community.communityId), { memberCount: increment(successCount) }); } catch (_) {}

    setDoneSources(p => ({ ...p, [currentSource!]: { count: successCount, errors: errors.length } }));
    setTotalImported(p => p + successCount);
    onSuccess();
    toast({ title: 'Import Complete', description: `${successCount} of ${pendingMembers.length} members imported.` });
    setTimeout(() => { setStep('sources'); setCurrentSource(null); setPendingMembers([]); setEditingId(null); }, 900);
  };

  const selectSource = (src: ImportSource) => {
    setCurrentSource(src); setPendingMembers([]); setEbError(''); setEbEvents([]);
    setStep(src === 'manual' ? 'preview' : 'configure');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl w-full p-0 gap-0 overflow-hidden [&>button:last-of-type]:hidden" style={{ maxHeight: '90vh' }}>

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
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setStep('sources')} style={{ borderColor: '#E8DFD1', color: '#5B4A3A' }}>Back</Button>
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
              <div className="flex items-center justify-between">
                <button onClick={() => { setStep(currentSource === 'manual' ? 'sources' : 'configure'); setPendingMembers([]); }}
                  className="text-sm flex items-center gap-1 hover:underline" style={{ color: '#8B7355' }}>
                  <ChevronLeft className="h-4 w-4" />{currentSource === 'manual' ? 'Back to sources' : 'Back'}
                </button>
                <h3 className="font-semibold" style={{ color: '#3D2E1E' }}>
                  {currentSource === 'manual' ? 'Add Manually' : `Preview — ${pendingMembers.length} contacts`}
                </h3>
                {pendingMembers.length > 0 && (
                  <Button size="sm" onClick={runImport} style={{ backgroundColor: '#5B4A3A', color: 'white' }}>
                    <Download className="h-4 w-4 mr-1.5" />Import {pendingMembers.length}
                  </Button>
                )}
              </div>

              {currentSource === 'manual' && (
                <div className="p-4 rounded-xl border space-y-3" style={{ borderColor: '#E8DFD1', backgroundColor: '#FDFAF7' }}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(['name', 'email', 'phone', 'tags'] as const).map(f => (
                      <div key={f}>
                        <label className="text-xs font-medium block mb-1 capitalize" style={{ color: '#8B7355' }}>{f}</label>
                        <input value={manualForm[f]} onChange={e => setManualForm(p => ({ ...p, [f]: e.target.value }))}
                          placeholder={f === 'tags' ? 'tag1, tag2' : f} onKeyDown={e => { if (e.key === 'Enter') addManualMember(); }}
                          className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none" style={{ borderColor: '#E8DFD1' }} />
                      </div>
                    ))}
                  </div>
                  <Button size="sm" onClick={addManualMember} style={{ backgroundColor: '#5B4A3A', color: 'white' }}>
                    <Plus className="h-3.5 w-3.5 mr-1" />Add
                  </Button>
                </div>
              )}

              {pendingMembers.length > 0 ? (
                <div className="overflow-auto rounded-xl border" style={{ borderColor: '#E8DFD1', maxHeight: '40vh' }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: '#F5F0EB' }}>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide w-8" style={{ color: '#8B7355' }}>#</th>
                        {['name', 'email', 'phone', 'tags', 'notes'].map(col => (
                          <th key={col} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: '#8B7355' }}>{col}</th>
                        ))}
                        <th className="w-16 px-4" />
                      </tr>
                    </thead>
                    <tbody>
                      {pendingMembers.map((m, i) => (
                        <tr key={m._id} className="border-t hover:bg-amber-50/30" style={{ borderColor: '#F0EBE3' }}>
                          <td className="px-4 py-2 text-xs" style={{ color: '#B0A090' }}>{i + 1}</td>
                          {['name', 'email', 'phone', 'tags', 'notes'].map(col => (
                            <td key={col} className="px-2 py-1.5">
                              {editingId === m._id
                                ? <input value={m[col]} onChange={e => setPendingMembers(p => p.map(x => x._id === m._id ? { ...x, [col]: e.target.value } : x))}
                                    className="w-full px-2 py-1 rounded border text-sm focus:outline-none" style={{ borderColor: '#E8DFD1' }} />
                                : <span className="px-2" style={{ color: m[col] ? '#3D2E1E' : '#C0B0A0' }}>{m[col] || '—'}</span>}
                            </td>
                          ))}
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
