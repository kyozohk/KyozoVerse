/**
 * Script to check GoDaddy DNS records for Resend domain verification
 * 
 * Usage: node scripts/check-godaddy-dns.js
 */

require('dotenv').config();

const GO_DADDY_API_KEY = process.env.GO_DADDY_API_KEY;
const GO_DADDY_API_SECRET = process.env.GO_DADDY_API_SECRET;

if (!GO_DADDY_API_KEY || !GO_DADDY_API_SECRET) {
  console.error('Error: GO_DADDY_API_KEY and GO_DADDY_API_SECRET must be set in .env');
  process.exit(1);
}

const BASE_URL = 'https://api.godaddy.com/v1';

// Domains to check (from Resend screenshot)
const DOMAINS_TO_CHECK = [
  { domain: 'kyozo.com', subdomain: 'test123' },
  { domain: 'kyozo.com', subdomain: 'testcommunity123' },
  { domain: 'kyozo.com', subdomain: 'aeropriest' },
  { domain: 'kyozo.com', subdomain: 'willer' },
  { domain: 'kyozo.com', subdomain: 'contact' },
];

async function fetchDNSRecords(domain, type = null) {
  const url = type 
    ? `${BASE_URL}/domains/${domain}/records/${type}`
    : `${BASE_URL}/domains/${domain}/records`;
  
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

async function checkResendRecords() {
  console.log('🔍 Checking GoDaddy DNS records for Resend verification...\n');
  console.log('='.repeat(60));

  try {
    // Fetch all TXT records for kyozo.com
    console.log('\n📋 Fetching all TXT records for kyozo.com...\n');
    const txtRecords = await fetchDNSRecords('kyozo.com', 'TXT');
    
    console.log('Found', txtRecords.length, 'TXT records:\n');
    
    txtRecords.forEach(record => {
      console.log(`  Host: ${record.name}`);
      console.log(`  Value: ${record.data.substring(0, 80)}${record.data.length > 80 ? '...' : ''}`);
      console.log(`  TTL: ${record.ttl}`);
      console.log('  ---');
    });

    // Check for SPF records
    console.log('\n📧 Checking for SPF records (for Resend)...\n');
    const spfRecords = txtRecords.filter(r => r.data.includes('spf') || r.data.includes('resend'));
    if (spfRecords.length > 0) {
      spfRecords.forEach(r => {
        console.log(`  ✅ Found SPF/Resend record at "${r.name}": ${r.data}`);
      });
    } else {
      console.log('  ⚠️  No SPF records found that include "resend"');
    }

    // Check for DKIM records (resend._domainkey)
    console.log('\n🔐 Checking for DKIM records...\n');
    const dkimRecords = txtRecords.filter(r => r.name.includes('domainkey') || r.name.includes('resend'));
    if (dkimRecords.length > 0) {
      dkimRecords.forEach(r => {
        console.log(`  ✅ Found DKIM record at "${r.name}"`);
      });
    } else {
      console.log('  ⚠️  No DKIM records found');
    }

    // Check for each subdomain
    console.log('\n📍 Checking subdomain-specific records...\n');
    for (const { subdomain } of DOMAINS_TO_CHECK) {
      const subdomainRecords = txtRecords.filter(r => 
        r.name === subdomain || 
        r.name.startsWith(`${subdomain}.`) ||
        r.name.includes(`resend._domainkey.${subdomain}`)
      );
      
      if (subdomainRecords.length > 0) {
        console.log(`  ✅ ${subdomain}.kyozo.com: Found ${subdomainRecords.length} record(s)`);
        subdomainRecords.forEach(r => {
          console.log(`     - ${r.name}: ${r.data.substring(0, 50)}...`);
        });
      } else {
        console.log(`  ❌ ${subdomain}.kyozo.com: No TXT records found`);
      }
    }

    // Also fetch CNAME records (sometimes used for DKIM)
    console.log('\n🔗 Fetching CNAME records...\n');
    const cnameRecords = await fetchDNSRecords('kyozo.com', 'CNAME');
    console.log('Found', cnameRecords.length, 'CNAME records:\n');
    
    cnameRecords.forEach(record => {
      console.log(`  ${record.name} -> ${record.data}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ DNS check complete!\n');
    console.log('If domains are still pending in Resend, make sure:');
    console.log('1. TXT records match exactly what Resend provides');
    console.log('2. For subdomains, the host should be just the subdomain name (e.g., "test123" not "test123.kyozo.com")');
    console.log('3. DKIM records should be at "resend._domainkey.{subdomain}" or similar');
    console.log('4. Wait up to 48 hours for DNS propagation\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkResendRecords();
