/**
 * Script to verify kyozo.com root domain in Resend
 * 
 * Usage: node scripts/verify-kyozo-com-domain.js
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

async function main() {
  console.log('='.repeat(60));
  console.log('🔧 Verifying kyozo.com root domain for Resend');
  console.log('='.repeat(60));
  console.log();

  try {
    // Step 1: Check if domain already exists in Resend
    console.log('🔍 Checking existing Resend domains...\n');
    const existingDomains = await resendRequest('/domains');
    let domain = existingDomains?.data?.find(d => d.name === DOMAIN);
    
    if (domain) {
      console.log(`✅ Domain ${DOMAIN} already exists in Resend`);
      console.log(`   Status: ${domain.status}`);
      console.log(`   ID: ${domain.id}\n`);
      
      if (domain.status === 'verified') {
        console.log('🎉 Domain is already verified! You can send from delete@kyozo.com\n');
        return;
      }
    } else {
      // Step 2: Add domain to Resend
      console.log(`➕ Adding ${DOMAIN} to Resend...\n`);
      domain = await resendRequest('/domains', {
        method: 'POST',
        body: JSON.stringify({ name: DOMAIN }),
      });
      console.log(`✅ Domain added! ID: ${domain.id}\n`);
    }

    // Step 3: Get required DNS records
    console.log('📋 Fetching required DNS records from Resend...\n');
    const domainDetails = await resendRequest(`/domains/${domain.id}`);
    
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
        // Determine the record name for GoDaddy
        let recordName = record.name;
        
        // For root domain, @ means root
        if (recordName === DOMAIN || recordName === '@') {
          recordName = '@';
        } else if (recordName.endsWith(`.${DOMAIN}`)) {
          recordName = recordName.replace(`.${DOMAIN}`, '');
        }
        
        console.log(`  Adding ${record.type} record: ${recordName || '@'}...`);
        
        await godaddyRequest(`/domains/${DOMAIN}/records/${record.type}`, {
          method: 'PATCH',
          body: JSON.stringify([{
            name: recordName || '@',
            data: record.value,
            ttl: 3600,
          }]),
        });
        
        console.log(`  ✅ Added\n`);
      } catch (error) {
        console.error(`  ❌ Failed: ${error.message}\n`);
        // Continue with other records
      }
    }

    console.log('⏳ Waiting 30 seconds for DNS propagation...\n');
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Step 5: Trigger verification
    console.log('✅ Triggering verification in Resend...\n');
    const verifyResult = await resendRequest(`/domains/${domain.id}/verify`, {
      method: 'POST',
    });
    
    console.log('🎉 Verification triggered!');
    console.log(`   Status: ${verifyResult?.status || 'pending'}\n`);
    console.log('⏳ DNS propagation can take up to 48 hours.');
    console.log('   Check Resend dashboard: https://resend.com/domains\n');
    console.log('📧 Once verified, you can send from delete@kyozo.com');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
