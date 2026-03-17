'use client';

import { useState, useEffect, useMemo } from 'react';

const SA_PASSWORD = 'kyozo123';

interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  createdAt: string;
}

interface Community {
  communityId: string;
  name: string;
  handle: string;
  ownerId: string;
  memberCount?: number;
  tagline?: string;
  communityProfileImage?: string;
}

export default function SuperAdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [users, setUsers] = useState<AuthUser[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [moveDialog, setMoveDialog] = useState<{ community: Community; targetUserId: string } | null>(null);
  const [moving, setMoving] = useState(false);
  const [moveResult, setMoveResult] = useState<{ success: boolean; message: string } | null>(null);

  const [userSearch, setUserSearch] = useState('');
  const [communitySearch, setCommunitySearch] = useState('');
  const [selectedOwnerFilter, setSelectedOwnerFilter] = useState<string>('all');
  const [transferUserSearch, setTransferUserSearch] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string>('');

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === SA_PASSWORD) {
      setAuthenticated(true);
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password. Hint: platform name followed by three numbers.');
    }
  };

  useEffect(() => {
    if (!authenticated) return;
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/sa/data', { headers: { 'x-sa-password': SA_PASSWORD } });
        if (!res.ok) throw new Error('Failed to fetch data');
        const data = await res.json();
        setUsers(data.users);
        setCommunities(data.communities);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [authenticated]);

  const handleMoveConfirm = async () => {
    if (!moveDialog?.targetUserId) return;
    setMoving(true);
    setMoveResult(null);
    try {
      const res = await fetch('/api/sa/move-community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-sa-password': SA_PASSWORD },
        body: JSON.stringify({
          communityId: moveDialog.community.communityId,
          fromUserId: moveDialog.community.ownerId,
          toUserId: moveDialog.targetUserId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMoveResult({ success: true, message: data.message });
        setCommunities(prev =>
          prev.map(c => c.communityId === moveDialog.community.communityId ? { ...c, ownerId: moveDialog.targetUserId } : c)
        );
        setTimeout(() => { setMoveDialog(null); setMoveResult(null); }, 2000);
      } else {
        setMoveResult({ success: false, message: data.message || data.error });
      }
    } catch (err: any) {
      setMoveResult({ success: false, message: err.message });
    } finally {
      setMoving(false);
    }
  };

  const filteredUsers = useMemo(() =>
    users.filter(u =>
      u.displayName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
    ), [users, userSearch]);

  const filteredCommunities = useMemo(() => {
    let list = communities;
    if (selectedOwnerFilter !== 'all') list = list.filter(c => c.ownerId === selectedOwnerFilter);
    if (communitySearch) list = list.filter(c =>
      c.name.toLowerCase().includes(communitySearch.toLowerCase()) ||
      c.handle.toLowerCase().includes(communitySearch.toLowerCase())
    );
    return list;
  }, [communities, communitySearch, selectedOwnerFilter]);

  const getUserById = (uid: string) => users.find(u => u.uid === uid);

  const handleSyncMemberCounts = async () => {
    setSyncing(true);
    setSyncResult('');
    try {
      const res = await fetch('/api/sa/sync-member-counts', {
        method: 'POST',
        headers: { 'x-sa-password': SA_PASSWORD },
      });
      const data = await res.json();
      if (res.ok) {
        setSyncResult(`✓ ${data.message}`);
        // Refresh communities data
        const refreshRes = await fetch('/api/sa/data', { headers: { 'x-sa-password': SA_PASSWORD } });
        const refreshData = await refreshRes.json();
        setCommunities(refreshData.communities);
      } else {
        setSyncResult(`✗ ${data.error}`);
      }
    } catch (e: any) {
      setSyncResult(`✗ ${e.message}`);
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncResult(''), 5000);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-purple-900/40 border border-purple-700 mb-4">
              <svg className="w-7 h-7 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">Super Admin</h1>
            <p className="text-sm text-gray-500 mt-1">Restricted access</p>
            <p className="text-sm text-gray-500 mt-1">Kyozo Sequence</p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                placeholder="Enter password"
                autoFocus
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
              />
              {passwordError && <p className="mt-2 text-xs text-red-400">{passwordError}</p>}
            </div>
            <button type="submit" className="w-full py-3 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-semibold transition-colors">
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="border-b border-gray-800 bg-gray-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-700 flex items-center justify-center text-white text-sm font-bold">SA</div>
          <div>
            <h1 className="font-bold text-white">Kyozo Super Admin</h1>
            <p className="text-xs text-gray-500">Firebase Data Management</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>{users.length} users</span>
            <span>·</span>
            <span>{communities.length} communities</span>
          </div>
          <button
            onClick={handleSyncMemberCounts}
            disabled={syncing}
            className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {syncing ? 'Syncing...' : 'Sync Member Counts'}
          </button>
          {syncResult && (
            <span className={`text-xs ${syncResult.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
              {syncResult}
            </span>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-32">
          <div className="flex items-center gap-3 text-gray-400">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Loading Firebase data...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="m-6 p-4 rounded-lg bg-red-900/30 border border-red-800 text-red-400 text-sm">Error: {error}</div>
      )}

      {!loading && !error && (
        <div className="flex h-[calc(100vh-61px)]">
          {/* Left — Users */}
          <div className="w-80 flex-shrink-0 border-r border-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-800">
              <h2 className="font-semibold text-gray-200 mb-3">Users ({filteredUsers.length})</h2>
              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-600"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              <button
                onClick={() => setSelectedOwnerFilter('all')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-800/50 transition-colors ${selectedOwnerFilter === 'all' ? 'bg-purple-900/30 border-l-2 border-l-purple-500' : 'hover:bg-gray-800/50'}`}
              >
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300 flex-shrink-0">All</div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-200">All Communities</p>
                  <p className="text-xs text-gray-500">{communities.length} total</p>
                </div>
              </button>
              {filteredUsers.map(user => {
                const owned = communities.filter(c => c.ownerId === user.uid);
                return (
                  <button
                    key={user.uid}
                    onClick={() => setSelectedOwnerFilter(user.uid)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-800/50 transition-colors ${selectedOwnerFilter === user.uid ? 'bg-purple-900/30 border-l-2 border-l-purple-500' : 'hover:bg-gray-800/50'}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-900/50 border border-purple-800/50 flex items-center justify-center text-xs font-bold text-purple-300 flex-shrink-0">
                      {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-200 truncate">{user.displayName}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    {owned.length > 0 && (
                      <span className="text-xs bg-gray-700 text-gray-300 rounded-full px-2 py-0.5 flex-shrink-0">{owned.length}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right — Communities */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center gap-4">
              <h2 className="font-semibold text-gray-200">Communities ({filteredCommunities.length})</h2>
              <input
                type="text"
                placeholder="Search communities..."
                value={communitySearch}
                onChange={e => setCommunitySearch(e.target.value)}
                className="flex-1 max-w-xs px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-600"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredCommunities.map(community => {
                  const owner = getUserById(community.ownerId);
                  return (
                    <div key={community.communityId} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-sm font-bold text-gray-400 flex-shrink-0 overflow-hidden">
                          {community.communityProfileImage
                            ? <img src={community.communityProfileImage} alt="" className="w-full h-full object-cover" />
                            : community.name?.charAt(0)?.toUpperCase() || 'C'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-100 truncate">{community.name}</p>
                          <p className="text-xs text-gray-500 truncate">@{community.handle}</p>
                          {community.tagline && <p className="text-xs text-gray-600 truncate mt-0.5">{community.tagline}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-800/60 mb-3">
                        <div className="w-6 h-6 rounded-full bg-purple-900/50 border border-purple-800/50 flex items-center justify-center text-xs font-bold text-purple-300 flex-shrink-0">
                          {owner?.displayName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-300 truncate">{owner?.displayName || 'Unknown'}</p>
                          <p className="text-xs text-gray-600 truncate">{owner?.email || community.ownerId}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">{community.memberCount ?? 0} members</span>
                        <button
                          onClick={() => setMoveDialog({ community, targetUserId: '' })}
                          className="text-xs px-3 py-1.5 rounded-lg bg-purple-900/40 border border-purple-800/50 text-purple-300 hover:bg-purple-900/70 transition-colors"
                        >
                          Move →
                        </button>
                      </div>
                    </div>
                  );
                })}
                {filteredCommunities.length === 0 && (
                  <div className="col-span-full flex items-center justify-center py-20 text-gray-600">No communities found</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Move Modal */}
      {moveDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white">Move Community</h2>
              <p className="text-sm text-gray-400 mt-1">Transfer ownership of <span className="text-white font-medium">{moveDialog.community.name}</span></p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">Current Owner</label>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/60 border border-gray-700">
                  <div className="w-8 h-8 rounded-full bg-red-900/40 border border-red-800/50 flex items-center justify-center text-sm font-bold text-red-300">
                    {getUserById(moveDialog.community.ownerId)?.displayName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm text-gray-200">{getUserById(moveDialog.community.ownerId)?.displayName || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{getUserById(moveDialog.community.ownerId)?.email || moveDialog.community.ownerId}</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">Transfer To</label>
                <input
                  type="text"
                  placeholder="Search by email..."
                  value={transferUserSearch}
                  onChange={e => setTransferUserSearch(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:border-purple-600 mb-2"
                />
                <select
                  value={moveDialog.targetUserId}
                  onChange={e => setMoveDialog(prev => prev ? { ...prev, targetUserId: e.target.value } : null)}
                  className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:border-purple-600"
                  size={6}
                >
                  <option value="">Select a user...</option>
                  {users
                    .filter(u => u.uid !== moveDialog.community.ownerId)
                    .filter(u => !transferUserSearch || u.email.toLowerCase().includes(transferUserSearch.toLowerCase()) || u.displayName.toLowerCase().includes(transferUserSearch.toLowerCase()))
                    .map(u => (
                      <option key={u.uid} value={u.uid}>{u.displayName} — {u.email}</option>
                    ))}
                </select>
              </div>
              {moveResult && (
                <div className={`p-3 rounded-lg text-sm ${moveResult.success ? 'bg-green-900/30 border border-green-800 text-green-400' : 'bg-red-900/30 border border-red-800 text-red-400'}`}>
                  {moveResult.message}
                </div>
              )}
            </div>
            <div className="p-6 pt-0 flex gap-3 justify-end">
              <button onClick={() => { setMoveDialog(null); setMoveResult(null); setTransferUserSearch(''); }} disabled={moving} className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 text-sm transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleMoveConfirm} disabled={moving || !moveDialog.targetUserId} className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {moving ? 'Moving...' : 'Confirm Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
