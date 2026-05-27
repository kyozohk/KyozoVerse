/**
 * Script to fetch all MX records for kyozo.com from GoDaddy
 *
 * Usage: node scripts/get-mx-records.js
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

async function fetchMXRecords() {
  const url = `${BASE_URL}/domains/${DOMAIN}/records/MX`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `sso-key ${GO_DADDY_API_KEY}:${GO_DADDY_API_SECRET}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GoDaddy API error: ${response.status} - ${error}`);
  }

  return response.json();
}

async function main() {
  console.log(`🔍 Fetching MX records for ${DOMAIN}...\n`);
  console.log('='.repeat(60));

  try {
    const mxRecords = await fetchMXRecords();

    if (mxRecords.length === 0) {
      console.log('\n⚠️  No MX records found for this domain.');
    } else {
      console.log(`\n✅ Found ${mxRecords.length} MX record(s):\n`);
      mxRecords.forEach((record, i) => {
        console.log(`  ${i + 1}. Name : ${record.name || '@'}`);
        console.log(`     Data : ${record.data}`);
        console.log(`     Priority : ${record.priority}`);
        console.log(`     TTL : ${record.ttl}`);
        console.log('  ' + '-'.repeat(40));
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Done!\n');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
