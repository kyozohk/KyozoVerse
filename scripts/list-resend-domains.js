/**
 * Script to list all Resend domains with their verification status
 * 
 * Usage: node scripts/list-resend-domains.js
 */

require('dotenv').config();

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY not set in .env');
  process.exit(1);
}

async function listDomains() {
  console.log('🔍 Fetching all Resend domains...\n');
  console.log('='.repeat(80));
  console.log();

  try {
    const response = await fetch('https://api.resend.com/domains', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      console.log('⚠️  No domains found in your Resend account.');
      return;
    }

    // Group by domain name
    const domainsByName = {};
    data.data.forEach(domain => {
      if (!domainsByName[domain.name]) {
        domainsByName[domain.name] = [];
      }
      domainsByName[domain.name].push(domain);
    });

    // Display summary
    console.log(`Found ${data.data.length} domain entries (${Object.keys(domainsByName).length} unique domains):\n`);
    
    const verifiedDomains = [];
    const unverifiedDomains = [];
    const failedDomains = [];

    Object.entries(domainsByName).forEach(([name, instances]) => {
      const hasVerified = instances.some(d => d.status === 'verified');
      const hasFailed = instances.some(d => d.status === 'failed');
      const allNotStarted = instances.every(d => d.status === 'not_started');
      
      if (hasVerified) {
        verifiedDomains.push({ name, instances });
      } else if (hasFailed) {
        failedDomains.push({ name, instances });
      } else if (allNotStarted) {
        unverifiedDomains.push({ name, instances });
      }
    });

    // Display verified domains
    if (verifiedDomains.length > 0) {
      console.log('✅ VERIFIED DOMAINS (can send emails):');
      console.log('-'.repeat(80));
      verifiedDomains.forEach(({ name, instances }) => {
        console.log(`\n📧 ${name}`);
        instances.forEach(d => {
          const icon = d.status === 'verified' ? '✅' : 
                       d.status === 'failed' ? '❌' : 
                       d.status === 'not_started' ? '⏳' : '❓';
          console.log(`   ${icon} ${d.region} - ${d.status} (ID: ${d.id})`);
          if (d.created_at) {
            const date = new Date(d.created_at);
            console.log(`      Created: ${date.toLocaleString()}`);
          }
        });
      });
      console.log();
    }

    // Display unverified domains
    if (unverifiedDomains.length > 0) {
      console.log('⏳ UNVERIFIED/NOT STARTED DOMAINS:');
      console.log('-'.repeat(80));
      unverifiedDomains.forEach(({ name, instances }) => {
        console.log(`\n📧 ${name}`);
        instances.forEach(d => {
          console.log(`   ⏳ ${d.region} - ${d.status} (ID: ${d.id})`);
        });
      });
      console.log();
    }

    // Display failed domains
    if (failedDomains.length > 0) {
      console.log('❌ FAILED DOMAINS (need DNS fix):');
      console.log('-'.repeat(80));
      failedDomains.forEach(({ name, instances }) => {
        console.log(`\n📧 ${name}`);
        instances.forEach(d => {
          console.log(`   ❌ ${d.region} - ${d.status} (ID: ${d.id})`);
        });
      });
      console.log();
    }

    console.log('='.repeat(80));
    console.log();
    console.log('📊 Summary:');
    console.log(`   ✅ Verified: ${verifiedDomains.length}`);
    console.log(`   ⏳ Unverified: ${unverifiedDomains.length}`);
    console.log(`   ❌ Failed: ${failedDomains.length}`);
    console.log();
    
    // Recommendations
    console.log('💡 Recommendations:');
    
    // Check for kyozo.com
    if (domainsByName['kyozo.com']?.some(d => d.status === 'verified')) {
      console.log(`   ✅ You can send from: delete@kyozo.com`);
    } else {
      console.log(`   ❌ kyozo.com is NOT verified - cannot send from delete@kyozo.com`);
    }
    
    // Check for contact.kyozo.com
    const contactDomain = domainsByName['contact.kyozo.com'];
    if (contactDomain) {
      const verifiedContact = contactDomain.filter(d => d.status === 'verified');
      const notStartedContact = contactDomain.filter(d => d.status === 'not_started');
      
      if (verifiedContact.length > 0) {
        console.log(`   ✅ You can send from: noreply@contact.kyozo.com`);
      }
      if (notStartedContact.length > 0) {
        console.log(`   ⏳ Pending verification: contact.kyozo.com (${notStartedContact.length} entries not started)`);
      }
    }
    
    console.log();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Optional: Get detailed records for a specific domain
async function getDomainRecords(domainId) {
  const response = await fetch(`https://api.resend.com/domains/${domainId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get domain details: ${response.status}`);
  }

  return response.json();
}

listDomains();
