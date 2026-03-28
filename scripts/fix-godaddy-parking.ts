/**
 * Fix GoDaddy Parking Page Issue
 * 
 * Problem: GoDaddy adds a "Parked" A record that redirects kyozo.com to /lander
 * Solution: Remove the parking A record, keep only the valid Vercel IP
 * 
 * Run: npx tsx scripts/fix-godaddy-parking.ts
 */

const GO_DADDY_API_KEY = process.env.GO_DADDY_API_KEY;
const GO_DADDY_API_SECRET = process.env.GO_DADDY_API_SECRET;
const BASE_DOMAIN = 'kyozo.com';
const GODADDY_BASE_URL = 'https://api.godaddy.com/v1';

async function fixParkingRecord() {
  if (!GO_DADDY_API_KEY || !GO_DADDY_API_SECRET) {
    console.error('❌ GoDaddy credentials not found in environment');
    return;
  }

  console.log('🔍 Fetching current A records for kyozo.com...');
  
  // Get all A records
  const getResponse = await fetch(`${GODADDY_BASE_URL}/domains/${BASE_DOMAIN}/records/A/@`, {
    method: 'GET',
    headers: {
      'Authorization': `sso-key ${GO_DADDY_API_KEY}:${GO_DADDY_API_SECRET}`,
      'Content-Type': 'application/json',
    },
  });

  if (!getResponse.ok) {
    console.error('❌ Failed to fetch A records:', await getResponse.text());
    return;
  }

  const records = await getResponse.json();
  console.log('📋 Current A records:', JSON.stringify(records, null, 2));

  // Filter out the "Parked" record
  const validRecords = records.filter((r: any) => r.data !== 'Parked');
  
  if (validRecords.length === records.length) {
    console.log('✅ No parking record found. DNS is clean!');
    return;
  }

  console.log(`🗑️  Removing ${records.length - validRecords.length} parking record(s)...`);
  console.log('✅ Keeping valid records:', validRecords);

  // Replace all A records with only the valid ones
  const putResponse = await fetch(`${GODADDY_BASE_URL}/domains/${BASE_DOMAIN}/records/A/@`, {
    method: 'PUT',
    headers: {
      'Authorization': `sso-key ${GO_DADDY_API_KEY}:${GO_DADDY_API_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(validRecords),
  });

  if (!putResponse.ok) {
    console.error('❌ Failed to update A records:', await putResponse.text());
    return;
  }

  console.log('✅ Parking record removed successfully!');
  console.log('🎉 kyozo.com should now work correctly');
}

fixParkingRecord().catch(console.error);
