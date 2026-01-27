/**
 * Script to delete incorrect duplicated DNS records from GoDaddy
 * 
 * Usage: node scripts/fix-godaddy-dns.js
 */

require('dotenv').config();

const GO_DADDY_API_KEY = process.env.GO_DADDY_API_KEY;
const GO_DADDY_API_SECRET = process.env.GO_DADDY_API_SECRET;

if (!GO_DADDY_API_KEY || !GO_DADDY_API_SECRET) {
  console.error('Error: GO_DADDY_API_KEY and GO_DADDY_API_SECRET must be set in .env');
  process.exit(1);
}

const BASE_URL = 'https://api.godaddy.com/v1';
const DOMAIN = 'kyozo.com';

// Records to delete (the duplicated ones)
const RECORDS_TO_DELETE = [
  { type: 'TXT', name: 'resend._domainkey.test123.test123' },
  { type: 'TXT', name: 'resend._domainkey.testcommunity123.testcommunity123' },
  { type: 'TXT', name: 'resend._domainkey.aeropriest.aeropriest' },
  { type: 'TXT', name: 'resend._domainkey.willer.willer' },
  { type: 'TXT', name: 'send.test123.test123' },
  { type: 'TXT', name: 'send.testcommunity123.testcommunity123' },
  { type: 'TXT', name: 'send.aeropriest.aeropriest' },
  { type: 'TXT', name: 'send.willer.willer' },
];

async function deleteRecord(type, name) {
  const url = `${BASE_URL}/domains/${DOMAIN}/records/${type}/${name}`;
  
  console.log(`  Deleting ${type} record: ${name}...`);
  
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `sso-key ${GO_DADDY_API_KEY}:${GO_DADDY_API_SECRET}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 204 || response.status === 200) {
    console.log(`  ✅ Deleted: ${name}`);
    return true;
  } else if (response.status === 404) {
    console.log(`  ⚠️  Not found (already deleted?): ${name}`);
    return true;
  } else {
    const error = await response.text();
    console.log(`  ❌ Failed to delete ${name}: ${response.status} - ${error}`);
    return false;
  }
}

async function fixDNSRecords() {
  console.log('🔧 Fixing GoDaddy DNS records...\n');
  console.log('='.repeat(60));
  console.log('\nDeleting duplicated records:\n');

  let successCount = 0;
  let failCount = 0;

  for (const record of RECORDS_TO_DELETE) {
    const success = await deleteRecord(record.type, record.name);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n✅ Completed: ${successCount} deleted, ${failCount} failed\n`);
  
  if (failCount === 0) {
    console.log('All duplicated records have been removed!');
    console.log('The correct records (e.g., resend._domainkey.test123) should remain.');
    console.log('\nNext steps:');
    console.log('1. Wait a few minutes for DNS propagation');
    console.log('2. Click "Verify" in Resend for each pending domain');
    console.log('3. If still pending, you may need to re-add the correct records from Resend\n');
  }
}

fixDNSRecords();
