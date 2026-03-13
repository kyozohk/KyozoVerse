import { createHash, randomBytes } from 'crypto';

export type ApiKeyScope =
  | 'communities:read'
  | 'communities:write'
  | 'posts:read'
  | 'posts:write'
  | 'members:read'
  | 'members:write'
  | 'broadcast:send'
  | 'ai:generate'
  | 'upload:write'
  | 'analytics:read';

export const ALL_SCOPES: ApiKeyScope[] = [
  'communities:read',
  'communities:write',
  'posts:read',
  'posts:write',
  'members:read',
  'members:write',
  'broadcast:send',
  'ai:generate',
  'upload:write',
  'analytics:read',
];

export type ApiKey = {
  id: string;
  keyHash: string;
  keyPrefix: string;
  label: string;
  ownerId: string;
  scopes: ApiKeyScope[];
  createdAt: any;
  lastUsedAt: any;
  isActive: boolean;
};

export type ApiKeyWithSecret = ApiKey & { secret: string };

export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const raw = `kz_${randomBytes(32).toString('hex')}`;
  const hash = createHash('sha256').update(raw).digest('hex');
  const prefix = raw.slice(0, 10);
  return { raw, hash, prefix };
}

export function hashApiKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7).trim();
  return null;
}

export function hasScope(key: ApiKey, scope: ApiKeyScope): boolean {
  return key.scopes.includes(scope);
}

export function requireScopes(key: ApiKey, scopes: ApiKeyScope[]): boolean {
  return scopes.every(s => key.scopes.includes(s));
}
