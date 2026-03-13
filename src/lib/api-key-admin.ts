import { createHash, randomBytes } from 'crypto';
import { adminDb as _adminDb } from './firebase-admin';
import { ApiKey, ApiKeyScope, ApiKeyWithSecret } from './api-key-utils';

function adminDb() {
  return _adminDb;
}

export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const raw = `kz_${randomBytes(32).toString('hex')}`;
  const hash = createHash('sha256').update(raw).digest('hex');
  const prefix = raw.slice(0, 10);
  return { raw, hash, prefix };
}

export function hashApiKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export async function createApiKeyAdmin(
  ownerId: string,
  label: string,
  scopes: ApiKeyScope[]
): Promise<ApiKeyWithSecret> {
  const { raw, hash, prefix } = generateApiKey();
  const db = adminDb();

  const keyData = {
    keyHash: hash,
    keyPrefix: prefix,
    label,
    ownerId,
    scopes,
    createdAt: new Date(),
    lastUsedAt: null,
    isActive: true,
  };

  const docRef = await db.collection('apiKeys').add(keyData);
  return { id: docRef.id, ...keyData, secret: raw } as ApiKeyWithSecret;
}

export async function validateApiKeyAdmin(raw: string): Promise<ApiKey | null> {
  if (!raw || !raw.startsWith('kz_')) return null;

  const hash = hashApiKey(raw);
  const db = adminDb();

  const snap = await db.collection('apiKeys')
    .where('keyHash', '==', hash)
    .where('isActive', '==', true)
    .limit(1)
    .get();

  if (snap.empty) return null;

  const keyDoc = snap.docs[0];
  await keyDoc.ref.update({ lastUsedAt: new Date() });

  return { id: keyDoc.id, ...keyDoc.data() } as ApiKey;
}

export async function listApiKeysAdmin(ownerId: string): Promise<ApiKey[]> {
  const db = adminDb();
  const snap = await db.collection('apiKeys').where('ownerId', '==', ownerId).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ApiKey));
}

export async function revokeApiKeyAdmin(keyId: string, ownerId: string): Promise<boolean> {
  const db = adminDb();
  const keyRef = db.collection('apiKeys').doc(keyId);
  const keySnap = await keyRef.get();
  if (!keySnap.exists || keySnap.data()?.ownerId !== ownerId) return false;
  await keyRef.update({ isActive: false });
  return true;
}
