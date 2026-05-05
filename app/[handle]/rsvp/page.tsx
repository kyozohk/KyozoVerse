'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Community } from '@/lib/types';
import { Globe, Lock, Mail, CheckCircle, Clock, XCircle, Users, Bell, Edit2, Trash2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Banner } from '@/components/ui/banner';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLoadingSkeleton } from '@/components/community/page-loading-skeleton';
import { CreateGuestlistDialog } from '@/components/guestlist/create-guestlist-dialog';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useCommunityAccess } from '@/hooks/use-community-access';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface MemberData {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  imageUrl: string;
  role?: string;
  joinedDate?: any;
  tags?: string[];
}

interface RsvpMember {
  id: string;
  userId: string;
  name: string;
  email?: string;
  imageUrl?: string;
  tags?: string[];
  rsvpStatus: 'pending' | 'accepted' | 'declined';
  rsvpToken?: string;
  addedAt?: string;
}

interface RsvpList {
  id: string;
  name: string;
  communityId: string;
  memberCount: number;
  members: RsvpMember[];
  createdAt: any;
  emailSentAt?: string;
}

export default function RsvpPage() {
  const params = useParams();
  const handle = params.handle as string;
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Access control hook
  const { community, userRole, loading: accessLoading, hasAccess } = useCommunityAccess({
    handle,
    requireAuth: true,
    allowedRoles: ['owner', 'admin', 'member'],
    redirectOnDenied: true,
  });
  
  const [members, setMembers] = useState<MemberData[]>([]);
  const [rsvpLists, setRsvpLists] = useState<RsvpList[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRsvp, setEditingRsvp] = useState<RsvpList | null>(null);
  const [expandedRsvp, setExpandedRsvp] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null); // tracks 'rsvpId' or 'rsvpId-memberId'
  const [deleteTarget, setDeleteTarget] = useState<RsvpList | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!community?.communityId || accessLoading) return;
      
      try {
        const memQ = query(collection(db, 'communityMembers'), where('communityId', '==', community.communityId));
        const memSnap = await getDocs(memQ);
        const membersData: MemberData[] = memSnap.docs.map(d => {
          const data = d.data();
          const ud = data.userDetails || {};
          return {
            id: d.id,
            userId: data.userId || d.id,
            name: ud.displayName || ud.name || data.displayName || 'Unknown',
            email: ud.email || data.email,
            phone: ud.phone || ud.phoneNumber || data.phone,
            imageUrl: ud.photoURL || ud.avatarUrl || data.avatarUrl || '/default-avatar.png',
            role: data.role,
            joinedDate: data.joinedAt,
            tags: data.tags || [],
          };
        });
        setMembers(membersData);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [community?.communityId, accessLoading]);

  useEffect(() => {
    if (!community?.communityId || !user) return;
    const q = query(collection(db, 'rsvps'), where('communityId', '==', community.communityId));
    const unsub = onSnapshot(q, snap => {
      const data: RsvpList[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as RsvpList));
      data.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setRsvpLists(data);
    }, (error) => {
      console.error('RSVP snapshot error:', error);
    });
    return () => unsub();
  }, [community?.communityId, user]);

  const canManage = userRole === 'owner' || userRole === 'admin';

  // Show loading state while checking access
  if (accessLoading || loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If no access, hook will redirect automatically
  if (!hasAccess) {
    return null;
  }

  if (!community) {
    return null;
  }

  const handleRsvpCreated = async (rsvp: any) => {
    if (!community || !rsvp.id) return;
    await sendConfirmationEmails(rsvp.id, rsvp.members, rsvp.name);
  };

  const sendConfirmationEmails = async (rsvpId: string, memberList: RsvpMember[], rsvpName: string, sendingStateKey?: string) => {
    if (!user || !community) return;
    setSendingEmail(sendingStateKey || rsvpId);
    try {
      const idToken = await user.getIdToken();
      const baseUrl = window.location.origin;

      const membersWithTokens: RsvpMember[] = memberList.map(m => ({
        ...m,
        rsvpToken: `${rsvpId}_${m.userId}_${Math.random().toString(36).slice(2)}`,
      }));

      await updateDoc(doc(db, 'rsvps', rsvpId), {
        members: membersWithTokens,
        emailSentAt: new Date().toISOString(),
      });

      let sent = 0;
      for (const member of membersWithTokens) {
        if (!member.email) continue;
        const acceptUrl = `${baseUrl}/rsvp/confirm?token=${member.rsvpToken}&action=accept`;
        const declineUrl = `${baseUrl}/rsvp/confirm?token=${member.rsvpToken}&action=decline`;
        const html = `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#F5F0E8;border-radius:12px;">
            <h2 style="color:#5B4A3A;margin-bottom:8px;">You're invited to RSVP</h2>
            <p style="color:#8B7355;margin-bottom:24px;">Hi ${member.name}, you've been added to <strong style="color:#5B4A3A">${rsvpName}</strong> in the <strong>${community.name}</strong> community.</p>
            <p style="color:#5B4A3A;margin-bottom:24px;">Please confirm your attendance:</p>
            <div style="display:flex;gap:16px;margin-bottom:32px;">
              <a href="${acceptUrl}" style="background:#E07B39;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">✓ Accept</a>
              <a href="${declineUrl}" style="background:#8B7355;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">✗ Decline</a>
            </div>
            <p style="color:#8B7355;font-size:12px;">This link is unique to you. Do not share it.</p>
          </div>`;
        const emailRes = await fetch('/api/v1/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
          body: JSON.stringify({
            to: member.email,
            subject: `RSVP Invitation: ${rsvpName} — ${community.name}`,
            html,
            communityId: community.communityId,
            communityHandle: handle,
            recipientName: member.name,
            recipientEmail: member.email,
          }),
        });
        if (!emailRes.ok) {
          console.error('Email send failed:', await emailRes.text());
        }
        sent++;
      }
      toast({ title: 'Invitations Sent', description: `${sent} confirmation email${sent === 1 ? '' : 's'} sent.` });
    } catch (err) {
      console.error('Failed to send emails:', err);
      toast({ title: 'Email Error', description: 'Failed to send some emails.', variant: 'destructive' });
    } finally {
      setSendingEmail(null);
    }
  };

  const handleSendReminder = async (rsvp: RsvpList) => {
    const pending = rsvp.members.filter(m => m.rsvpStatus === 'pending' && m.email);
    if (pending.length === 0) {
      toast({ title: 'No pending members', description: 'All members have already responded.' });
      return;
    }
    await sendConfirmationEmails(rsvp.id, pending, rsvp.name);
  };

  const handleSendMemberReminder = async (rsvp: RsvpList, member: RsvpMember) => {
    if (!member.email) {
      toast({ title: 'No email', description: 'This member does not have an email address.', variant: 'destructive' });
      return;
    }
    await sendConfirmationEmails(rsvp.id, [member], rsvp.name, `${rsvp.id}-${member.id}`);
  };

  const handleDeleteRsvp = async () => {
    if (!deleteTarget || !user) return;
    try {
      const idToken = await user.getIdToken();
      await fetch('/api/rsvps/update', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ rsvpId: deleteTarget.id }),
      });
      toast({ title: 'RSVP Deleted' });
    } catch {
      const { deleteDoc: fsDeleteDoc, doc: fsDoc } = await import('firebase/firestore');
      const { db: fsDb } = await import('@/firebase/firestore');
      await fsDeleteDoc(fsDoc(fsDb, 'rsvps', deleteTarget.id));
      toast({ title: 'RSVP Deleted' });
    } finally {
      setDeleteTarget(null);
    }
  };

  const statusBadge = (status: RsvpMember['rsvpStatus']) => {
    if (status === 'accepted') return <Badge className="text-xs" style={{ backgroundColor: '#dcfce7', color: '#166534', border: 'none' }}><CheckCircle className="h-3 w-3 mr-1" />Accepted</Badge>;
    if (status === 'declined') return <Badge className="text-xs" style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: 'none' }}><XCircle className="h-3 w-3 mr-1" />Declined</Badge>;
    return <Badge className="text-xs" style={{ backgroundColor: '#fef9c3', color: '#713f12', border: 'none' }}><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
  };

  if (loading) return <PageLoadingSkeleton showMemberList={true} />;

  if (!community) {
    return (
      <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--page-bg-color)' }}>
        <div className="p-8"><div className="rounded-2xl p-8" style={{ backgroundColor: 'var(--page-content-bg)', border: '2px solid var(--page-content-border)' }}><p>Community not found</p></div></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--page-bg-color)' }}>
      <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-auto">
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--page-content-bg)', border: '2px solid var(--page-content-border)' }}>
          <Banner
            backgroundImage={community.communityBackgroundImage}
            iconImage={community.communityProfileImage}
            title={community.name}
            location={community.location}
            locationExtra={
              <span className="flex items-center gap-1 text-sm text-white/90">
                {community.visibility === 'private' ? <><Lock className="h-3.5 w-3.5" />Private</> : <><Globe className="h-3.5 w-3.5" />Public</>}
              </span>
            }
            subtitle={community.tagline || community.mantras}
            ctas={canManage ? [{ label: 'Create RSVP', icon: <Mail className="h-4 w-4" />, onClick: () => setIsCreateDialogOpen(true) }] : []}
            height="16rem"
          />

          <div className="px-6 pt-6 pb-6">
            <div className="flex flex-col gap-4 max-w-full">
              {rsvpLists.length === 0 ? (
                <div className="text-center py-16 rounded-xl" style={{ backgroundColor: '#FAF8F5', border: '1px dashed #E8DFD1' }}>
                  <Mail className="h-12 w-12 mx-auto mb-3" style={{ color: '#D8CFC0' }} />
                  <p className="text-base font-medium" style={{ color: '#8B7355' }}>No RSVP lists yet</p>
                  {canManage && <p className="text-sm mt-1" style={{ color: '#B0A090' }}>Create an RSVP list to send confirmation emails to members</p>}
                </div>
              ) : (
                rsvpLists.map(rsvp => {
                const accepted = rsvp.members.filter(m => m.rsvpStatus === 'accepted').length;
                const declined = rsvp.members.filter(m => m.rsvpStatus === 'declined').length;
                const pending = rsvp.members.filter(m => m.rsvpStatus === 'pending').length;
                const isExpanded = expandedRsvp === rsvp.id;

                return (
                  <Card key={rsvp.id} className="p-3 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg truncate flex-1" style={{ color: '#5B4A3A' }}>{rsvp.name}</h3>
                      {canManage && (
                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                          <button
                            onClick={() => { setEditingRsvp(rsvp); setIsCreateDialogOpen(true); }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#F5F0EA] transition-colors"
                            style={{ color: '#8B7355' }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(rsvp)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
                            style={{ color: '#DC2626' }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Stats Grid - 2x2 */}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ backgroundColor: '#F0FDF4' }}>
                        <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#16a34a' }} />
                        <span className="text-sm font-medium" style={{ color: '#166534' }}>{accepted}</span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ backgroundColor: '#FFFBEB' }}>
                        <Clock className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#d97706' }} />
                        <span className="text-sm font-medium" style={{ color: '#92400e' }}>{pending}</span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ backgroundColor: '#FEF2F2' }}>
                        <XCircle className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#dc2626' }} />
                        <span className="text-sm font-medium" style={{ color: '#991b1b' }}>{declined}</span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ backgroundColor: '#F5F0EA' }}>
                        <Users className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#8B7355' }} />
                        <span className="text-sm font-medium" style={{ color: '#5B4A3A' }}>{rsvp.memberCount}</span>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-0.5 mb-2">
                      {rsvp.createdAt && (
                        <p className="text-xs" style={{ color: '#B0A090' }}>
                          Created {new Date(rsvp.createdAt.toDate ? rsvp.createdAt.toDate() : rsvp.createdAt).toLocaleDateString()}
                        </p>
                      )}
                      {rsvp.emailSentAt && (
                        <p className="text-xs" style={{ color: '#B0A090' }}>
                          Invites sent {new Date(rsvp.emailSentAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-auto space-y-2">
                      {/* Send Invitations Button (only if not sent yet) */}
                      {canManage && !rsvp.emailSentAt && rsvp.members.length > 0 && (
                        <button
                          onClick={() => sendConfirmationEmails(rsvp.id, rsvp.members, rsvp.name)}
                          disabled={sendingEmail === rsvp.id}
                          className="w-full py-2 rounded-lg text-sm font-medium transition-colors"
                          style={{ 
                            backgroundColor: sendingEmail === rsvp.id ? '#F5F0EA' : '#E07B39', 
                            color: 'white',
                            opacity: sendingEmail === rsvp.id ? 0.6 : 1
                          }}
                        >
                          {sendingEmail === rsvp.id ? (
                            <><Loader2 className="inline h-4 w-4 mr-1 animate-spin" />Sending...</>
                          ) : (
                            <><Mail className="inline h-4 w-4 mr-1" />Send Invitations</>
                          )}
                        </button>
                      )}
                      
                      {/* View Members Button */}
                      <button
                        onClick={() => setExpandedRsvp(isExpanded ? null : rsvp.id)}
                        className="w-full py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#F5F0EA]"
                        style={{ color: '#8B7355', border: '1px solid #E8DFD1' }}
                      >
                        {isExpanded ? (
                          <><ChevronUp className="inline h-4 w-4 mr-1" />Hide Members</>
                        ) : (
                          <><ChevronDown className="inline h-4 w-4 mr-1" />View Members</>
                        )}
                      </button>
                    </div>

                    {/* Expanded Members */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: '#E8DFD1' }}>
                        {rsvp.members.map(member => (
                          <div key={member.id} className="flex items-center gap-2 py-2 px-2 rounded-lg" style={{ backgroundColor: '#FAF8F5' }}>
                            <UserAvatar name={member.name} imageUrl={member.imageUrl && member.imageUrl !== '/default-avatar.png' ? member.imageUrl : null} size={32} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate" style={{ color: '#3D2E22' }}>{member.name}</p>
                              {member.email && <p className="text-[10px] truncate" style={{ color: '#8B7355' }}>{member.email}</p>}
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {canManage && member.rsvpStatus === 'pending' && (
                                <button
                                  onClick={() => handleSendMemberReminder(rsvp, member)}
                                  disabled={sendingEmail === `${rsvp.id}-${member.id}`}
                                  className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-[#FEF3EC] transition-colors"
                                  style={{ color: '#E07B39' }}
                                  title="Send reminder"
                                >
                                  <Bell className="h-3 w-3" />
                                </button>
                              )}
                              {statusBadge(member.rsvpStatus)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                );
              })
              )}
            </div>
          </div>
        </div>
      </div>

      <CreateGuestlistDialog
        key={editingRsvp?.id || 'new-rsvp'}
        isOpen={isCreateDialogOpen}
        onClose={() => { setIsCreateDialogOpen(false); setEditingRsvp(null); }}
        members={members}
        communityId={community.communityId}
        communityName={community.name}
        onGuestlistCreated={handleRsvpCreated}
        existingGuestlist={editingRsvp}
        isRsvp={true}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete RSVP List</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRsvp} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
