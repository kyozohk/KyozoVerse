/**
 * Setup a community subdomain end-to-end (DNS + Resend).
 *
 * Mirrors app/api/setup-community-domain/route.ts but runs locally
 * with credentials from .env.local — no Firebase auth needed.
 *
 * Usage:
 *   node scripts/setup-community-domain.js <handle>
 *   e.g. node scripts/setup-community-domain.js willer
 */

require('dotenv').config({ path: '.env.local' });

const GO_DADDY_API_KEY = process.env.GO_DADDY_API_KEY;
const GO_DADDY_API_SECRET = process.env.GO_DADDY_API_SECRET;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

const GODADDY_BASE_URL = 'https://api.godaddy.com/v1';
const RESEND_BASE_URL = 'https://api.resend.com';
const BASE_DOMAIN = 'kyozo.com';
const REGION = 'ap-northeast-1'; // Tokyo — closer to HK
const SES_BOUNCE_HOST = `feedback-smtp.${REGION}.amazonses.com`;
const RESEND_INBOUND_HOST = `inbound-smtp.${REGION}.resend.com`;

const handle = process.argv[2];

if (!handle) {
  console.error('Usage: node scripts/setup-community-domain.js <handle>');
  process.exit(1);
}

if (!GO_DADDY_API_KEY || !GO_DADDY_API_SECRET) {
  console.error('Missing GO_DADDY_API_KEY / GO_DADDY_API_SECRET in .env.local');
  process.exit(1);
}

if (!RESEND_API_KEY) {
  console.error('Missing RESEND_API_KEY in .env.local');
  process.exit(1);
}

const sanitized = handle
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9-]/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

if (sanitized !== handle) {
  console.log(`ℹ️  Sanitized handle: "${handle}" → "${sanitized}"`);
}

const domainName = `${sanitized}.${BASE_DOMAIN}`;

async function patchGoDaddy(records) {
  const res = await fetch(`${GODADDY_BASE_URL}/domains/${BASE_DOMAIN}/records`, {
    method: 'PATCH',
    headers: {
      Authorization: `sso-key ${GO_DADDY_API_KEY}:${GO_DADDY_API_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(records),
  });
  if (!res.ok) {
    const text = await res.text();
    return { ok: false, status: res.status, error: text };
  }
  return { ok: true };
}

async function registerResendDomain() {
  console.log(`\n📨 Registering ${domainName} with Resend...`);
  const res = await fetch(`${RESEND_BASE_URL}/domains`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: domainName, region: REGION }),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = (data.message || data.error || '').toLowerCase();
    if (msg.includes('already') || msg.includes('exist')) {
      console.log(`   ↳ Already registered, looking it up...`);
      const list = await fetch(`${RESEND_BASE_URL}/domains`, {
        headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
      }).then((r) => r.json());
      const existing = list.data?.find((d) => d.name === domainName);
      if (existing) {
        console.log(`   ✓ Found existing domain ID: ${existing.id} (status: ${existing.status})`);
        return { ok: true, id: existing.id, status: existing.status };
      }
    }
    console.error(`   ✗ Resend error:`, data);
    return { ok: false, error: data };
  }
  console.log(`   ✓ Registered. ID: ${data.id}`);
  return { ok: true, id: data.id, status: data.status };
}

async function getResendDomain(domainId) {
  const res = await fetch(`${RESEND_BASE_URL}/domains/${domainId}`, {
    headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
  });
  if (!res.ok) return null;
  return res.json();
}

async function verifyResendDomain(domainId) {
  console.log(`\n🔁 Triggering Resend verification for ${domainName}...`);
  const res = await fetch(`${RESEND_BASE_URL}/domains/${domainId}/verify`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
  });
  if (!res.ok) {
    const text = await res.text();
    console.warn(`   ✗ Verify failed (${res.status}): ${text}`);
    return false;
  }
  const data = await res.json();
  console.log(`   ✓ Verification triggered. Status: ${data.status || 'pending'}`);
  return true;
}

(async () => {
  console.log('========================================');
  console.log(`Setting up community domain: ${domainName}`);
  console.log('========================================');

  // 1. Outbound DNS records (SPF + SES bounce MX on send.{handle})
  console.log(`\n🌐 Adding outbound DNS records on send.${sanitized}...`);
  const outRes = await patchGoDaddy([
    { type: 'TXT', name: `send.${sanitized}`, data: 'v=spf1 include:amazonses.com ~all', ttl: 600 },
    { type: 'MX', name: `send.${sanitized}`, data: SES_BOUNCE_HOST, priority: 10, ttl: 600 },
  ]);
  if (outRes.ok) console.log('   ✓ Outbound SPF + MX added');
  else console.warn(`   ⚠ Outbound (${outRes.status}): ${outRes.error}`);

  // 2. Inbound MX on {handle} → resend inbound server
  console.log(`\n📥 Adding inbound MX on ${sanitized}...`);
  const inRes = await patchGoDaddy([
    { type: 'MX', name: sanitized, data: RESEND_INBOUND_HOST, priority: 10, ttl: 600 },
  ]);
  if (inRes.ok) console.log('   ✓ Inbound MX added');
  else console.warn(`   ⚠ Inbound (${inRes.status}): ${inRes.error}`);

  // 3. Register with Resend
  const resendResult = await registerResendDomain();
  if (!resendResult.ok || !resendResult.id) {
    console.error('Cannot continue without Resend domain ID');
    process.exit(1);
  }

  // 4. Fetch DKIM record from Resend
  console.log(`\n🔑 Fetching DKIM record from Resend...`);
  const details = await getResendDomain(resendResult.id);
  const dkim = details?.records?.find(
    (r) => (r.record === 'DKIM' || r.type === 'TXT') && r.name?.includes('domainkey')
  );

  if (dkim) {
    console.log(`   Found DKIM: ${dkim.name}`);
    const dkimNameOnly = dkim.name.replace(`.${BASE_DOMAIN}`, '');
    const dkimRes = await patchGoDaddy([
      { type: 'TXT', name: dkimNameOnly, data: dkim.value, ttl: 600 },
    ]);
    if (dkimRes.ok) console.log(`   ✓ DKIM TXT added to GoDaddy: ${dkimNameOnly}`);
    else console.warn(`   ⚠ DKIM (${dkimRes.status}): ${dkimRes.error}`);
  } else {
    console.warn('   ⚠ No DKIM record returned by Resend');
  }

  // 5. Wait then trigger verification
  console.log(`\n⏳ Waiting 5s for DNS propagation...`);
  await new Promise((r) => setTimeout(r, 5000));
  await verifyResendDomain(resendResult.id);

  // 6. Final status
  console.log(`\n📊 Final status check...`);
  const final = await getResendDomain(resendResult.id);
  console.log(`   Domain: ${final?.name}`);
  console.log(`   Status: ${final?.status}`);
  if (final?.records) {
    console.log(`   Records:`);
    final.records.forEach((r) => {
      console.log(`     ${r.type} ${r.name} → ${r.value} [${r.status || '—'}]`);
    });
  }

  console.log('\n✅ Setup complete.');
  console.log(`   Send from: message@${domainName}`);
  console.log(`   Reply to:  reply@${domainName}`);
  console.log(`\nIf status is still "pending" / "not_started", DNS may take a few minutes`);
  console.log(`to propagate. Re-run verification with:`);
  console.log(`   node scripts/setup-community-domain.js ${sanitized}`);
})();
