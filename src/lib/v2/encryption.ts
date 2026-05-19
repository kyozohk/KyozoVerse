/**
 * Symmetric encryption for at-rest secrets — OAuth tokens, primarily.
 *
 * Format on Firestore: a single base64 string containing:
 *   [version:1][iv:12][tag:16][ciphertext]
 *
 * The key comes from env (`KYOZO_TOKEN_ENC_KEY`, 32 bytes base64-encoded).
 * Generate with:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 *
 * Production note: swap this module to call Cloud KMS by replacing
 * `getKey()` to fetch from KMS and `encrypt/decrypt` to call its
 * encrypt/decrypt endpoints. The on-disk format is unchanged.
 */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'crypto';

const VERSION = 0x01;
const IV_LEN = 12;
const TAG_LEN = 16;

function getKey(): Buffer {
  const raw = process.env.KYOZO_TOKEN_ENC_KEY;
  if (!raw) {
    throw new Error(
      'KYOZO_TOKEN_ENC_KEY is not set. Generate with: ' +
        "node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\""
    );
  }
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error(
      `KYOZO_TOKEN_ENC_KEY must decode to 32 bytes (got ${key.length}). Re-generate.`
    );
  }
  return key;
}

/** Encrypt plaintext. Returns a base64 envelope. */
export function encryptString(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([Buffer.from([VERSION]), iv, tag, ct]).toString('base64');
}

/** Decrypt a base64 envelope produced by encryptString. Throws on tamper. */
export function decryptString(envelope: string): string {
  const buf = Buffer.from(envelope, 'base64');
  if (buf.length < 1 + IV_LEN + TAG_LEN) throw new Error('Envelope too short');
  if (buf[0] !== VERSION) throw new Error(`Unsupported envelope version: ${buf[0]}`);
  const iv = buf.subarray(1, 1 + IV_LEN);
  const tag = buf.subarray(1 + IV_LEN, 1 + IV_LEN + TAG_LEN);
  const ct = buf.subarray(1 + IV_LEN + TAG_LEN);
  const decipher = createDecipheriv('aes-256-gcm', getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
}

/**
 * Sign and verify short-lived state tokens for OAuth flows.
 *
 * The state is a base64url string containing:
 *   { workspaceId, uid, provider, nonce, exp }
 * encrypted (so it doubles as opaque to the client) and decryptable only
 * by us. exp is unix-ms; we reject states older than `maxAgeMs`.
 */
export function signOauthState(payload: {
  workspaceId: string;
  uid: string;
  provider: string;
  ttlMs?: number;
}): string {
  const ttl = payload.ttlMs ?? 10 * 60 * 1000; // 10 minutes
  const data = {
    workspaceId: payload.workspaceId,
    uid: payload.uid,
    provider: payload.provider,
    nonce: randomBytes(8).toString('base64url'),
    exp: Date.now() + ttl,
  };
  return encryptString(JSON.stringify(data))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function verifyOauthState(
  token: string,
  expectedProvider: string
): { workspaceId: string; uid: string } | null {
  try {
    const b64 = token.replace(/-/g, '+').replace(/_/g, '/');
    const json = decryptString(b64);
    const data = JSON.parse(json) as {
      workspaceId: string;
      uid: string;
      provider: string;
      exp: number;
    };
    if (data.provider !== expectedProvider) return null;
    if (Date.now() > data.exp) return null;
    return { workspaceId: data.workspaceId, uid: data.uid };
  } catch {
    return null;
  }
}
