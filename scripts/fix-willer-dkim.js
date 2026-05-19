/**
 * Cleanup: replace TXT records on resend._domainkey.willer with ONLY the
 * correct DKIM p=... value (removes the stray "resend._domainkey.willer"
 * junk TXT that's blocking Resend verification).
 *
 * Also normalizes MX on send.willer to us-east-1.
 */
require('dotenv').config({ path: '.env.local' });

const KEY = process.env.GO_DADDY_API_KEY;
const SECRET = process.env.GO_DADDY_API_SECRET;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const BASE = 'kyozo.com';
const HANDLE = 'willer';

async function gd(method, path, body) {
  const res = await fetch(`https://api.godaddy.com/v1${path}`, {
    method,
    headers: {
      Authorization: `sso-key ${KEY}:${SECRET}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}

(async () => {
  // 1. Get DKIM record from Resend (source of truth)
  const list = await fetch('https://api.resend.com/domains', {
    headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
  }).then((r) => r.json());
  const wDomain = list.data?.find((d) => d.name === `${HANDLE}.${BASE}`);
  if (!wDomain) {
    console.error('willer.kyozo.com not found in Resend');
    process.exit(1);
  }
  const detail = await fetch(`https://api.resend.com/domains/${wDomain.id}`, {
    headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
  }).then((r) => r.json());

  const dkim = detail.records?.find(
    (r) => (r.record === 'DKIM' || r.type === 'TXT') && r.name?.includes('domainkey')
  );
  if (!dkim) {
    console.error('No DKIM record found in Resend response');
    process.exit(1);
  }
  console.log(`Resend DKIM value: ${dkim.value.substring(0, 80)}...`);

  // 2. Replace ALL TXT records on resend._domainkey.willer with only the correct one
  console.log(`\nReplacing TXT records on resend._domainkey.${HANDLE}...`);
  const dkimReplace = await gd('PUT', `/domains/${BASE}/records/TXT/resend._domainkey.${HANDLE}`, [
    { data: dkim.value, ttl: 600 },
  ]);
  console.log(`  status: ${dkimReplace.status} ${dkimReplace.ok ? '✓' : '✗'}`);
  if (!dkimReplace.ok) console.log(`  body: ${dkimReplace.body}`);

  // 3. Replace MX records on send.willer with us-east-1 (was ap-northeast-1)
  console.log(`\nReplacing MX records on send.${HANDLE}...`);
  const mxReplace = await gd('PUT', `/domains/${BASE}/records/MX/send.${HANDLE}`, [
    { data: 'feedback-smtp.us-east-1.amazonses.com', priority: 10, ttl: 600 },
  ]);
  console.log(`  status: ${mxReplace.status} ${mxReplace.ok ? '✓' : '✗'}`);
  if (!mxReplace.ok) console.log(`  body: ${mxReplace.body}`);

  // 4. Trigger Resend re-verification
  console.log(`\nWaiting 10s for DNS propagation...`);
  await new Promise((r) => setTimeout(r, 10000));

  console.log(`Triggering Resend verification...`);
  const v = await fetch(`https://api.resend.com/domains/${wDomain.id}/verify`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
  });
  const vData = await v.json().catch(() => null);
  console.log(`  ${v.status}: ${JSON.stringify(vData)}`);

  // 5. Final status
  const final = await fetch(`https://api.resend.com/domains/${wDomain.id}`, {
    headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
  }).then((r) => r.json());
  console.log(`\nFinal status: ${final.status}`);
  final.records?.forEach((r) => {
    console.log(`  ${r.type} ${r.name} [${r.status}]`);
  });
})();
