'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usePlatformRole } from '@/hooks/use-platform-role';
import { useToast } from '@/hooks/use-toast';
import {
  WorkspaceMember,
  PlatformRole,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_COLORS,
  INVITABLE_ROLES,
} from '@/lib/platform-roles';
import { UserPlus, Trash2, RefreshCw, ShieldOff, Loader2, Users, Mail, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function RoleBadge({ role }: { role: PlatformRole }) {
  const colors = ROLE_COLORS[role];
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
      style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

function StatusBadge({ status }: { status: WorkspaceMember['status'] }) {
  const styles = {
    active: { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7', label: 'Active' },
    pending: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D', label: 'Pending' },
    revoked: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5', label: 'Revoked' },
  };
  const s = styles[status];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
      style={{ backgroundColor: s.bg, color: s.text, borderColor: s.border }}
    >
      {s.label}
    </span>
  );
}

export default function TeamPage() {
  const { user } = useAuth();
  const { role: myRole, permissions, loading: roleLoading } = usePlatformRole();
  const { toast } = useToast();

  const [members, setMembers] = useState<(WorkspaceMember & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDisplayName, setInviteDisplayName] = useState('');
  const [inviteRole, setInviteRole] = useState<Exclude<PlatformRole, 'owner'>>('admin');
  const [isInviting, setIsInviting] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<(WorkspaceMember & { id: string }) | null>(null);

  const authedFetch = useCallback(async (input: RequestInfo, init: RequestInit = {}) => {
    if (!user) throw new Error('Not signed in');
    const token = await user.getIdToken();
    return fetch(input, {
      ...init,
      headers: {
        ...(init.headers || {}),
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  }, [user]);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authedFetch('/api/admin/workspace-members');
      if (!res.ok) throw new Error(`List failed: ${res.status}`);
      const { members } = await res.json();
      setMembers(members);
    } catch (err) {
      console.error('Error fetching team members:', err);
    } finally {
      setLoading(false);
    }
  }, [authedFetch]);

  useEffect(() => {
    if (!roleLoading && myRole === 'owner') {
      fetchMembers();
    } else if (!roleLoading) {
      setLoading(false);
    }
  }, [myRole, roleLoading, fetchMembers]);

  const handleInvite = async () => {
    if (!user) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!inviteEmail || !emailRegex.test(inviteEmail)) {
      toast({ title: 'Invalid Email', description: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }
    if (!inviteDisplayName.trim()) {
      toast({ title: 'Name Required', description: 'Please enter a display name for this team member.', variant: 'destructive' });
      return;
    }

    const normalizedEmail = inviteEmail.toLowerCase().trim();
    if (members.some(m => m.email === normalizedEmail && m.status !== 'revoked')) {
      toast({ title: 'Already Invited', description: 'This email already has an active or pending invitation.', variant: 'destructive' });
      return;
    }

    setIsInviting(true);
    try {
      const res = await authedFetch('/api/admin/workspace-members', {
        method: 'POST',
        body: JSON.stringify({
          email: normalizedEmail,
          displayName: inviteDisplayName.trim(),
          role: inviteRole,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Invite failed: ${res.status}`);
      }
      toast({ title: 'Invitation Created', description: `${inviteDisplayName} has been invited as ${ROLE_LABELS[inviteRole]}. They can sign in with their credentials to activate access.` });
      setInviteEmail('');
      setInviteDisplayName('');
      fetchMembers();
    } catch (err: any) {
      console.error('Error creating invite:', err);
      toast({ title: 'Error', description: err?.message || 'Failed to create invitation.', variant: 'destructive' });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      const res = await authedFetch(`/api/admin/workspace-members/${revokeTarget.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'revoked' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Revoke failed: ${res.status}`);
      }
      toast({ title: 'Access Revoked', description: `${revokeTarget.displayName}'s access has been revoked.` });
      fetchMembers();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to revoke access.', variant: 'destructive' });
    } finally {
      setRevokeTarget(null);
    }
  };

  const handleReactivate = async (member: WorkspaceMember & { id: string }) => {
    try {
      const res = await authedFetch(`/api/admin/workspace-members/${member.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'pending' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Reactivate failed: ${res.status}`);
      }
      toast({ title: 'Invitation Reactivated', description: `${member.displayName} can now sign in again.` });
      fetchMembers();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to reactivate invitation.', variant: 'destructive' });
    }
  };

  if (roleLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (myRole !== 'owner') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground">Manage who has access to this workspace.</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <ShieldOff className="h-12 w-12 text-muted-foreground" />
            <h3 className="font-semibold text-lg">Access Restricted</h3>
            <p className="text-muted-foreground max-w-sm">Only workspace owners can manage team members. Contact your workspace owner to make changes.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
        <p className="text-muted-foreground">Invite team members and control what they can access in this workspace.</p>
      </div>

      {/* Role Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5" /> Role Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {INVITABLE_ROLES.map(role => (
              <div key={role} className="rounded-lg p-4 border" style={{ borderColor: ROLE_COLORS[role].border, backgroundColor: ROLE_COLORS[role].bg + '66' }}>
                <div className="flex items-center gap-2 mb-2">
                  <RoleBadge role={role} />
                </div>
                <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Invite Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> Invite Team Member</CardTitle>
          <CardDescription>Add someone to your workspace. They sign in with their existing credentials — no sign-up required.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-sm font-medium block mb-1.5">Display Name</label>
              <Input
                placeholder="Jane Smith"
                value={inviteDisplayName}
                onChange={e => setInviteDisplayName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Email Address</label>
              <Input
                type="email"
                placeholder="jane@example.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleInvite()}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Role</label>
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as Exclude<PlatformRole, 'owner'>)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {INVITABLE_ROLES.map(r => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>
            <Button onClick={handleInvite} disabled={isInviting}>
              {isInviting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
              Add Member
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Team Members</CardTitle>
          <CardDescription>{members.filter(m => m.status !== 'revoked').length} active / pending member{members.filter(m => m.status !== 'revoked').length !== 1 ? 's' : ''}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : members.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No team members yet. Invite someone above.</p>
            </div>
          ) : (
            <div className="divide-y">
              {/* Workspace owner row */}
              <div className="flex items-center justify-between py-3 gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{user?.displayName || 'You'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <RoleBadge role="owner" />
                  <StatusBadge status="active" />
                </div>
                <div className="w-20" />
              </div>

              {members.map(member => (
                <div key={member.id} className="flex items-center justify-between py-3 gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{member.displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <RoleBadge role={member.role} />
                    <StatusBadge status={member.status} />
                  </div>
                  <div className="flex items-center gap-1 w-20 justify-end">
                    {member.status === 'revoked' ? (
                      <Button variant="ghost" size="sm" onClick={() => handleReactivate(member)} title="Reactivate">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => setRevokeTarget(member)} className="text-red-500 hover:text-red-600 hover:bg-red-50" title="Revoke access">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revoke Confirm Dialog */}
      <AlertDialog open={!!revokeTarget} onOpenChange={open => !open && setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Access</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <strong>{revokeTarget?.displayName}</strong> ({revokeTarget?.email}) from this workspace? They will be immediately signed out and unable to access any community data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke} className="bg-red-600 hover:bg-red-700">Revoke Access</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
