/**
 * Delete willer.kyozo.com from Resend (us-east-1) and recreate in
 * ap-northeast-1 (Tokyo). Also fixes GoDaddy MX records to point at
 * Tokyo SES + Resend inbound endpoints.
 *
 * Run: node scripts/recreate-willer-tokyo.js
 */
require('dotenv').config({ path: '.env.local' });

const KEY = process.env.GO_DADDY_API_KEY;
const SECRET = process.env.GO_DADDY_API_SECRET;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const BASE = 'kyozo.com';
const HANDLE = 'willer';
const REGION = 'ap-northeast-1';
const SES_BOUNCE = `feedback-smtp.${REGION}.amazonses.com`;
const RESEND_INBOUND = `inbound-smtp.${REGION}.resend.com`;
const FQDN = `${HANDLE}.${BASE}`;

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

async function rs(method, path, body) {
  const res = await fetch(`https://api.resend.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

(async () => {
  // 1. Find and delete existing Resend domain
  console.log('🔍 Looking up existing willer.kyozo.com in Resend...');
  const list = await rs('GET', '/domains');
  const existing = list.data?.data?.filter((d) => d.name === FQDN) || [];
  console.log(`   Found ${existing.length} existing entry(s)`);
  for (const d of existing) {
    console.log(`   Deleting ${d.id} (${d.region}, ${d.status})...`);
    const del = await rs('DELETE', `/domains/${d.id}`);
    console.log(`     → ${del.status}`);
  }

  // 2. Re-create in Tokyo
  console.log(`\n📨 Creating ${FQDN} in ${REGION}...`);
  const create = await rs('POST', '/domains', { name: FQDN, region: REGION });
  if (!create.ok) {
    console.error('   ✗ Failed:', create.data);
    process.exit(1);
  }
  const newId = create.data.id;
  console.log(`   ✓ Created. ID: ${newId}`);

  // 3. Fetch new DKIM (key changes per region)
  const detail = await rs('GET', `/domains/${newId}`);
  const dkim = detail.data?.records?.find(
    (r) => (r.record === 'DKIM' || r.type === 'TXT') && r.name?.includes('domainkey')
  );
  console.log(`\n🔑 New DKIM: ${dkim.value.substring(0, 80)}...`);

  // 4. Replace DKIM TXT in GoDaddy
  console.log(`\n🛠 Replacing DKIM TXT on resend._domainkey.${HANDLE}...`);
  const dkimReplace = await gd(
    'PUT',
    `/domains/${BASE}/records/TXT/resend._domainkey.${HANDLE}`,
    [{ data: dkim.value, ttl: 600 }]
  );
  console.log(`   status: ${dkimReplace.status}`);

  // 5. Replace SES bounce MX on send.willer with Tokyo
  console.log(`\n🛠 Replacing MX on send.${HANDLE} → ${SES_BOUNCE}...`);
  const mxOut = await gd('PUT', `/domains/${BASE}/records/MX/send.${HANDLE}`, [
    { data: SES_BOUNCE, priority: 10, ttl: 600 },
  ]);
  console.log(`   status: ${mxOut.status}`);

  // 6. Replace inbound MX on willer with Tokyo
  console.log(`\n🛠 Replacing inbound MX on ${HANDLE} → ${RESEND_INBOUND}...`);
  const mxIn = await gd('PUT', `/domains/${BASE}/records/MX/${HANDLE}`, [
    { data: RESEND_INBOUND, priority: 10, ttl: 600 },
  ]);
  console.log(`   status: ${mxIn.status}`);

  // 7. Wait + trigger verification
  console.log(`\n⏳ Waiting 15s for DNS propagation...`);
  await new Promise((r) => setTimeout(r, 15000));

  console.log(`Triggering verification...`);
  const v = await rs('POST', `/domains/${newId}/verify`);
  console.log(`   ${v.status}: ${JSON.stringify(v.data)}`);

  // 8. Final status
  const final = await rs('GET', `/domains/${newId}`);
  console.log(`\n📊 Final status: ${final.data.status} (region: ${final.data.region})`);
  final.data.records?.forEach((r) => {
    console.log(`   ${r.type} ${r.name} [${r.status}]`);
  });
})();
