'use client';

import React, { useEffect, useState } from 'react';
import { V06DialogShell } from '@/components/ui/v06-dialog-shell';
import { db } from '@/firebase/firestore';
import { collection, query, where, getDocs, getDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  Mail,
  Calendar,
  Cake,
  Pencil,
  Check,
  X as XIcon,
  RotateCw,
  Send,
  Users,
  Tag,
  Key,
  UserPlus,
  Globe,
  Lock,
  User
} from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { RoundImage } from '@/components/ui/round-image';

interface MemberDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  member: {
    id: string;
    userId: string;
    name: string;
    email?: string;
    phone?: string;
    imageUrl?: string;
    joinedDate?: any;
    tags?: string[];
  } | null;
}

export function MemberDetailsDialog({ isOpen, onClose, member }: MemberDetailsDialogProps) {
  const [userCommunities, setUserCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  // Apple guideline 1.2.1(a): age-gating on the mobile app reads
  // `users/{uid}.birthYear`. Operators can set or update it from here for
  // existing members who pre-date the in-app signup form.
  const [birthYear, setBirthYear] = useState<number | null>(null);
  const [editingAge, setEditingAge] = useState(false);
  const [ageDraft, setAgeDraft] = useState<string>('');
  const [savingAge, setSavingAge] = useState(false);

  useEffect(() => {
    if (!isOpen || !member?.userId) return;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'communityMembers'),
          where('userId', '==', member.userId)
        );
        const [memberSnap, userSnap] = await Promise.all([
          getDocs(q),
          getDoc(doc(db, 'users', member.userId)),
        ]);

        const memberships = memberSnap.docs.map(d => d.data());
        const communityDetails = await Promise.all(
          memberships.map(async (m) => {
            const commSnap = await getDoc(doc(db, 'communities', m.communityId));
            if (commSnap.exists()) {
              return {
                id: commSnap.id,
                ...commSnap.data(),
                role: m.role || 'member'
              };
            }
            return null;
          })
        );
        setUserCommunities(communityDetails.filter(Boolean));

        const userData = userSnap.exists() ? userSnap.data() : null;
        const rawYear = (userData?.birthYear as number | undefined) ?? null;
        setBirthYear(rawYear);
        setAgeDraft(rawYear != null ? String(rawYear) : '');
        setEditingAge(false);
      } catch (e) {
        console.error('Error fetching member detail:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [isOpen, member?.userId]);

  const saveBirthYear = async () => {
    if (!member?.userId) return;
    const trimmed = ageDraft.trim();
    if (trimmed === '') {
      // Clearing the field is allowed — it puts the user back to the
      // conservative "no age = treat as minor" default in the mobile app.
      setSavingAge(true);
      try {
        await setDoc(
          doc(db, 'users', member.userId),
          {
            birthYear: null,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
        setBirthYear(null);
        setEditingAge(false);
      } catch (e) {
        console.error('Failed to clear birthYear:', e);
        alert('Could not clear age. See console.');
      } finally {
        setSavingAge(false);
      }
      return;
    }
    const year = Number(trimmed);
    const now = new Date().getFullYear();
    if (!Number.isInteger(year) || year < 1900 || year > now) {
      alert(`Enter a valid year between 1900 and ${now}.`);
      return;
    }
    setSavingAge(true);
    try {
      await setDoc(
        doc(db, 'users', member.userId),
        {
          birthYear: year,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      setBirthYear(year);
      setEditingAge(false);
    } catch (e) {
      console.error('Failed to save birthYear:', e);
      alert('Could not save age. See console.');
    } finally {
      setSavingAge(false);
    }
  };

  const ageThisYear = birthYear != null ? new Date().getFullYear() - birthYear : null;

  if (!member) return null;

  const formatJoined = (date: any): string => {
    if (!date) return '—';
    const d = date?.seconds ? new Date(date.seconds * 1000) : new Date(date);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Memory block definitions matching the screenshot
  const memoryBlocks = [
    {
      title: 'Total Spins',
      value: '0',
      icon: RotateCw,
      color: '#D97706',
      bg: '#FEF3C7',
    },
    {
      title: 'Messages Sent',
      value: '0',
      icon: Send,
      color: '#2563EB',
      bg: '#DBEAFE',
    },
    {
      title: 'Communities',
      value: String(loading ? '...' : userCommunities.length || 1),
      icon: Users,
      color: '#7C3AED',
      bg: '#F3E8FF',
    },
    {
      title: 'Tags applied',
      value: String(member.tags?.length || 0),
      icon: Tag,
      color: '#16A34A',
      bg: '#DCFCE7',
    },
    {
      title: 'Keys collected',
      value: '41',
      icon: Key,
      color: '#CA8A04',
      bg: '#FEF9C3',
    },
    {
      title: 'Referrals',
      value: 'Sign Up',
      icon: UserPlus,
      color: '#854D0E',
      bg: '#FEF3C7',
    },
  ];

  return (
    <V06DialogShell
      open={isOpen}
      onClose={onClose}
      title="Member Details"
      Icon={User}
      size="lg"
    >
      <div className="flex flex-col gap-6 text-[#3D2E1F]">
        {/* Top Profile Card */}
        <div 
          className="p-6 rounded-2xl border flex flex-col sm:flex-row items-center sm:items-start gap-5 bg-[#FAF5EC]/30"
          style={{ borderColor: '#E8DFD1' }}
        >
          <UserAvatar imageUrl={member.imageUrl || ''} name={member.name} size={64} />
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 justify-center sm:justify-start">
              <h3 className="text-xl font-bold text-[#3D2E1F]">{member.name}</h3>
              <span 
                className="px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center justify-center self-center sm:self-auto"
                style={{ backgroundColor: '#FAF5EC', borderColor: '#DDD2BD', color: '#6B5F52' }}
              >
                Member
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-[#6B5F52]">
              {member.email && (
                <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                  <Mail className="h-4 w-4" style={{ color: '#9B8A75' }} />
                  <span>{member.email}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                <Calendar className="h-4 w-4" style={{ color: '#9B8A75' }} />
                <span>Joined: {formatJoined(member.joinedDate)}</span>
              </div>
            </div>

            {/*
              Apple guideline 1.2.1(a): the mobile app gates 17+ content on
              this user's declared birth year. Operators can set it here for
              members who pre-date the in-app signup form.
            */}
            <div className="mt-3 flex items-center gap-2 justify-center sm:justify-start text-sm text-[#6B5F52]">
              <Cake className="h-4 w-4" style={{ color: '#9B8A75' }} />
              {editingAge ? (
                <>
                  <span>Year of birth:</span>
                  <input
                    type="number"
                    min={1900}
                    max={new Date().getFullYear()}
                    value={ageDraft}
                    onChange={(e) => setAgeDraft(e.target.value)}
                    placeholder="e.g. 1995"
                    className="w-24 rounded-md border px-2 py-1 text-sm"
                    style={{ borderColor: '#DDD2BD' }}
                    autoFocus
                    disabled={savingAge}
                  />
                  <button
                    type="button"
                    onClick={saveBirthYear}
                    disabled={savingAge}
                    className="inline-flex items-center justify-center rounded-md border px-2 py-1 text-xs font-semibold disabled:opacity-50"
                    style={{ backgroundColor: '#FAF5EC', borderColor: '#DDD2BD', color: '#3D2E1F' }}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    {savingAge ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAge(false);
                      setAgeDraft(birthYear != null ? String(birthYear) : '');
                    }}
                    disabled={savingAge}
                    className="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-semibold text-[#6B5F52] hover:bg-[#FAF5EC] disabled:opacity-50"
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <span>
                    Year of birth:{' '}
                    {birthYear != null ? (
                      <>
                        <strong className="text-[#3D2E1F]">{birthYear}</strong>
                        {ageThisYear != null && (
                          <span className="ml-1 text-[#9B8A75]">
                            (~{ageThisYear} yrs)
                          </span>
                        )}
                        {ageThisYear != null && ageThisYear < 17 && (
                          <span
                            className="ml-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide"
                            style={{ backgroundColor: '#FEF3C7', borderColor: '#FACC15', color: '#854D0E' }}
                          >
                            Minor — 17+ posts hidden
                          </span>
                        )}
                      </>
                    ) : (
                      <em className="text-[#9B8A75]">not set</em>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingAge(true)}
                    className="inline-flex items-center justify-center rounded-md p-1 text-[#6B5F52] hover:bg-[#FAF5EC]"
                    aria-label="Edit year of birth"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Member Memory Section */}
        <div>
          <h4 className="text-sm font-bold text-[#6B5F52] uppercase tracking-wider mb-3">Member Memory</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {memoryBlocks.map((block, idx) => {
              const IconComp = block.icon;
              return (
                <div 
                  key={idx} 
                  className="p-4 rounded-2xl flex flex-col items-center justify-between text-center gap-3 transition-transform hover:scale-[1.02]"
                  style={{ backgroundColor: block.bg }}
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)' }}
                  >
                    <IconComp className="h-5 w-5" style={{ color: block.color }} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground/85" style={{ color: '#6B5F52' }}>
                      {block.title}
                    </span>
                    <span className="text-lg font-extrabold text-[#3D2E1F]">
                      {block.value}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Your Communities Section */}
        <div>
          <h4 className="text-sm font-bold text-[#6B5F52] uppercase tracking-wider mb-3">
            Member of {loading ? '...' : userCommunities.length || 1} Your Communities
          </h4>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-pulse">
              <div className="h-16 bg-[#FAF5EC] rounded-xl border border-[#E8DFD1]" />
              <div className="h-16 bg-[#FAF5EC] rounded-xl border border-[#E8DFD1]" />
            </div>
          ) : userCommunities.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Fallback to current community if list is empty or loading */}
              <div 
                className="p-4 rounded-xl border flex items-center justify-between bg-white"
                style={{ borderColor: '#E8DFD1' }}
              >
                <div className="flex items-center gap-3">
                  <RoundImage src="" alt="Community" size={36} border />
                  <span className="font-bold text-[#3D2E1F]">Current Community</span>
                </div>
                <span 
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold border"
                  style={{ backgroundColor: '#FAF5EC', borderColor: '#DDD2BD', color: '#6B5F52' }}
                >
                  Member
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {userCommunities.map((comm) => (
                <div 
                  key={comm.id} 
                  className="p-4 rounded-xl border flex items-center justify-between bg-white transition-all hover:shadow-sm"
                  style={{ borderColor: '#E8DFD1' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <RoundImage 
                      src={comm.communityProfileImage || ''} 
                      alt={comm.name} 
                      size={36} 
                      border 
                    />
                    <span className="font-bold text-[#3D2E1F] truncate text-[14px]">
                      {comm.name}
                    </span>
                  </div>
                  <span 
                    className="px-2.5 py-0.5 rounded-full text-xs font-bold border flex-shrink-0"
                    style={{ 
                      backgroundColor: comm.role === 'owner' ? '#FFF5F2' : '#FAF5EC', 
                      borderColor: comm.role === 'owner' ? '#FFE2DF' : '#DDD2BD', 
                      color: comm.role === 'owner' ? '#E05A47' : '#6B5F52' 
                    }}
                  >
                    {comm.role.charAt(0).toUpperCase() + comm.role.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </V06DialogShell>
  );
}
