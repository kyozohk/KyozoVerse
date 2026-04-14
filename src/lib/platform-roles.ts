export type PlatformRole = 'owner' | 'admin' | 'community_creator' | 'read_only';
export type WorkspaceMemberStatus = 'pending' | 'active' | 'revoked';

export interface WorkspaceMember {
  id?: string;
  email: string;
  displayName: string;
  userId: string | null;
  role: Exclude<PlatformRole, 'owner'>; // 'owner' is implicit — not stored
  status: WorkspaceMemberStatus;
  invitedBy: string;
  createdAt: any;
  updatedAt?: any;
}

export const ROLE_LABELS: Record<PlatformRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  community_creator: 'Community Creator',
  read_only: 'Read Only',
};

export const ROLE_DESCRIPTIONS: Record<PlatformRole, string> = {
  owner: 'Full control: all communities, team management, billing, and settings.',
  admin: 'Full access to all communities and features. Cannot manage team members or billing.',
  community_creator: 'Can create communities and has full control within their own communities only. Cannot view other communities.',
  read_only: 'Can view all communities, members, and analytics. Cannot make any changes.',
};

export const ROLE_COLORS: Record<PlatformRole, { bg: string; text: string; border: string }> = {
  owner: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  admin: { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
  community_creator: { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
  read_only: { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' },
};

export interface PlatformPermissions {
  canCreateCommunity: boolean;
  canManageAllCommunities: boolean;
  canManageTeam: boolean;
  canManageBilling: boolean;
  canViewAnalytics: boolean;
  canExportData: boolean;
  isReadOnly: boolean;
  communityScope: 'all' | 'owned';
}

export const ROLE_PERMISSIONS: Record<PlatformRole, PlatformPermissions> = {
  owner: {
    canCreateCommunity: true,
    canManageAllCommunities: true,
    canManageTeam: true,
    canManageBilling: true,
    canViewAnalytics: true,
    canExportData: true,
    isReadOnly: false,
    communityScope: 'all',
  },
  admin: {
    canCreateCommunity: true,
    canManageAllCommunities: true,
    canManageTeam: false,
    canManageBilling: false,
    canViewAnalytics: true,
    canExportData: true,
    isReadOnly: false,
    communityScope: 'all',
  },
  community_creator: {
    canCreateCommunity: true,
    canManageAllCommunities: false,
    canManageTeam: false,
    canManageBilling: false,
    canViewAnalytics: false,
    canExportData: true,
    isReadOnly: false,
    communityScope: 'owned',
  },
  read_only: {
    canCreateCommunity: false,
    canManageAllCommunities: false,
    canManageTeam: false,
    canManageBilling: false,
    canViewAnalytics: true,
    canExportData: false,
    isReadOnly: true,
    communityScope: 'all',
  },
};

export const INVITABLE_ROLES: Exclude<PlatformRole, 'owner'>[] = [
  'admin',
  'community_creator',
  'read_only',
];
