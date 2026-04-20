/**
 * Script to add and verify contact.kyozo.com in Resend via GoDaddy DNS
 * 
 * This script:
 * 1. Adds contact.kyozo.com to Resend (if not already added)
 * 2. Gets the required DNS records from Resend
 * 3. Adds those DNS records to GoDaddy
 * 4. Triggers verification in Resend
 * 
 * Usage: node scripts/verify-contact-subdomain.js
 */

require('dotenv').config();

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const GO_DADDY_API_KEY = process.env.GO_DADDY_API_KEY;
const GO_DADDY_API_SECRET = process.env.GO_DADDY_API_SECRET;

if (!RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY not set in .env');
  process.exit(1);
}

if (!GO_DADDY_API_KEY || !GO_DADDY_API_SECRET) {
  console.error('❌ GO_DADDY_API_KEY and GO_DADDY_API_SECRET must be set in .env');
  process.exit(1);
}

const RESEND_BASE_URL = 'https://api.resend.com';
const GODADDY_BASE_URL = 'https://api.godaddy.com/v1';
const DOMAIN = 'kyozo.com';
const SUBDOMAIN = 'contact';

async function resendRequest(endpoint, options = {}) {
  const url = `${RESEND_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error (${response.status}): ${error}`);
  }

  return response.json().catch(() => null);
}

async function godaddyRequest(endpoint, options = {}) {
  const url = `${GODADDY_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `sso-key ${GO_DADDY_API_KEY}:${GO_DADDY_API_SECRET}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GoDaddy API error (${response.status}): ${error}`);
  }

  return response.status === 204 ? null : response.json().catch(() => null);
}

async function getResendDomains() {
  console.log('🔍 Checking existing Resend domains...\n');
  return resendRequest('/domains');
}

async function addDomainToResend(domain) {
  console.log(`➕ Adding ${domain} to Resend...\n`);
  return resendRequest('/domains', {
    method: 'POST',
    body: JSON.stringify({ name: domain }),
  });
}

async function getDomainRecords(domainId) {
  console.log(`📋 Getting DNS records for domain ${domainId}...\n`);
  return resendRequest(`/domains/${domainId}`);
}

async function addDNSRecordToGoDaddy(type, name, data, ttl = 3600) {
  console.log(`  📝 Adding ${type} record: ${name} = ${data.substring(0, 60)}...\n`);
  
  // GoDaddy expects the record name without the domain suffix
  const recordName = name.replace(`.${DOMAIN}`, '').replace(DOMAIN, '');
  
  return godaddyRequest(`/domains/${DOMAIN}/records/${type}`, {
    method: 'PATCH',
    body: JSON.stringify([{
      name: recordName || '@',
      data: data,
      ttl: ttl,
    }]),
  });
}

async function verifyDomainInResend(domainId) {
  console.log(`✅ Triggering verification for domain ${domainId}...\n`);
  return resendRequest(`/domains/${domainId}/verify`, {
    method: 'POST',
  });
}

async function main() {
  const fullDomain = `${SUBDOMAIN}.${DOMAIN}`;
  
  console.log('='.repeat(60));
  console.log('🔧 Verifying contact.kyozo.com for Resend');
  console.log('='.repeat(60));
  console.log();

  try {
    // Step 1: Check if domain already exists in Resend
    const existingDomains = await getResendDomains();
    let domain = existingDomains?.data?.find(d => d.name === fullDomain);
    
    if (domain) {
      console.log(`✅ Domain ${fullDomain} already exists in Resend`);
      console.log(`   Status: ${domain.status}`);
      console.log(`   ID: ${domain.id}\n`);
      
      if (domain.status === 'verified') {
        console.log('🎉 Domain is already verified! No action needed.\n');
        return;
      }
    } else {
      // Step 2: Add domain to Resend
      console.log(`➕ Adding ${fullDomain} to Resend...\n`);
      domain = await addDomainToResend(fullDomain);
      console.log(`✅ Domain added! ID: ${domain.id}\n`);
    }

    // Step 3: Get required DNS records
    console.log('📋 Fetching required DNS records from Resend...\n');
    const domainDetails = await getDomainRecords(domain.id);
    
    if (!domainDetails.records || domainDetails.records.length === 0) {
      console.log('⚠️  No DNS records found. Domain may still be initializing.');
      console.log('   Wait a few minutes and run this script again.\n');
      return;
    }

    console.log(`Found ${domainDetails.records.length} DNS records to add:\n`);
    domainDetails.records.forEach((record, i) => {
      console.log(`  ${i + 1}. ${record.type}: ${record.name} = ${record.value.substring(0, 50)}...`);
    });
    console.log();

    // Step 4: Add DNS records to GoDaddy
    console.log('📝 Adding DNS records to GoDaddy...\n');
    
    for (const record of domainDetails.records) {
      try {
        // For subdomain, we need to adjust the record name
        let recordName = record.name;
        
        // If it's a subdomain record like resend._domainkey.contact.kyozo.com
        // GoDaddy expects: resend._domainkey.contact
        if (recordName.includes(fullDomain)) {
          recordName = recordName.replace(`.${fullDomain}`, '');
        }
        
        await addDNSRecordToGoDaddy(
          record.type,
          recordName,
          record.value,
          record.priority || 3600
        );
        
        console.log(`  ✅ Added ${record.type} record: ${recordName}\n`);
      } catch (error) {
        console.error(`  ❌ Failed to add ${record.type} record: ${error.message}\n`);
        // Continue with other records
      }
    }

    console.log('⏳ Waiting 30 seconds for DNS propagation...\n');
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Step 5: Trigger verification
    console.log('✅ Triggering verification in Resend...\n');
    const verifyResult = await verifyDomainInResend(domain.id);
    
    console.log('🎉 Verification triggered!');
    console.log(`   Status: ${verifyResult?.status || 'pending'}\n`);
    console.log('⏳ DNS propagation can take up to 48 hours.');
    console.log('   Check Resend dashboard: https://resend.com/domains\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
