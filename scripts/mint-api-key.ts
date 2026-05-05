/**
 * Mint a Kyozo API key.
 *
 * Usage:
 *   pnpm tsx scripts/mint-api-key.ts \
 *     --name "Production WhatsApp bot" \
 *     --scopes "email:send,whatsapp:send,communities:read" \
 *     [--owner-uid <uid>] [--owner-community <handle>]
 *
 * Prints the raw key ONCE. Store it immediately; it is never recoverable.
 */

import { db } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { generateApiKey, API_KEYS_COLLECTION } from '@/lib/api-key-auth';

function parseArgs(argv: string[]) {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        out[key] = next;
        i++;
      } else {
        out[key] = 'true';
      }
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const name = args.name;
  const scopesRaw = args.scopes || '';
  const ownerUid = args['owner-uid'];
  const ownerCommunity = args['owner-community'];

  if (!name) {
    console.error('Error: --name is required');
    process.exit(1);
  }

  const scopes = scopesRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (scopes.length === 0) {
    console.error(
      'Error: --scopes is required (comma-separated). ' +
        'Available: email:send, email:setup-domain, whatsapp:send, whatsapp:read, ' +
        'ai:generate, broadcast:read, broadcast:write, communities:read, waitlist:write, * (all)'
    );
    process.exit(1);
  }

  const { rawKey, prefix, keyHash } = generateApiKey();

  const doc: Record<string, unknown> = {
    keyHash,
    prefix,
    name,
    scopes,
    createdAt: FieldValue.serverTimestamp(),
  };
  if (ownerUid) doc.ownerUid = ownerUid;
  if (ownerCommunity) doc.ownerCommunity = ownerCommunity;

  await db.collection(API_KEYS_COLLECTION).doc(keyHash).set(doc);

  console.log('');
  console.log('  Kyozo API key minted');
  console.log('  --------------------');
  console.log('  Name:     ', name);
  console.log('  Scopes:   ', scopes.join(', '));
  if (ownerUid) console.log('  Owner UID:', ownerUid);
  if (ownerCommunity) console.log('  Community:', ownerCommunity);
  console.log('  Prefix:   ', prefix);
  console.log('');
  console.log('  RAW KEY (store now, never shown again):');
  console.log('');
  console.log('    ' + rawKey);
  console.log('');
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed to mint key:', err);
  process.exit(1);
});
