// Script to check Resend domain verification status
// Usage: node scripts/check-resend-domains.js

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY not set in environment');
  console.log('Run: export RESEND_API_KEY=your_api_key');
  process.exit(1);
}

async function checkDomains() {
  try {
    console.log('🔍 Checking Resend domains...\n');
    
    const response = await fetch('https://api.resend.com/domains', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to fetch domains:', error);
      process.exit(1);
    }

    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      console.log('⚠️  No domains found in your Resend account.');
      console.log('   You need to add and verify your domain first.');
      return;
    }

    console.log(`📋 Found ${data.data.length} domain(s):\n`);
    
    data.data.forEach((domain, index) => {
      const isVerified = domain.status === 'verified';
      const icon = isVerified ? '✅' : '❌';
      const status = isVerified ? 'VERIFIED' : domain.status?.toUpperCase() || 'UNKNOWN';
      
      console.log(`${index + 1}. ${icon} ${domain.name}`);
      console.log(`   Status: ${status}`);
      console.log(`   ID: ${domain.id}`);
      
      if (domain.records) {
        console.log(`   Records:`);
        domain.records.forEach(record => {
          console.log(`     - ${record.type}: ${record.name} → ${record.value} (${record.status})`);
        });
      }
      
      if (!isVerified) {
        console.log(`\n   ⚠️  Action needed: Add these DNS records to verify ${domain.name}`);
        if (domain.records) {
          domain.records.forEach(record => {
            console.log(`      ${record.type} record: ${record.name} = ${record.value}`);
          });
        }
      }
      console.log('');
    });

    // Check for our problematic domains
    const contactDomain = data.data.find(d => d.name === 'contact.kyozo.com');
    const rootDomain = data.data.find(d => d.name === 'kyozo.com');
    
    console.log('🔎 Summary for your domains:\n');
    
    if (contactDomain) {
      const isVerified = contactDomain.status === 'verified';
      console.log(`contact.kyozo.com: ${isVerified ? '✅ VERIFIED' : '❌ NOT VERIFIED'}`);
    } else {
      console.log(`contact.kyozo.com: ❌ NOT ADDED (needs to be added to Resend)`);
    }
    
    if (rootDomain) {
      const isVerified = rootDomain.status === 'verified';
      console.log(`kyozo.com: ${isVerified ? '✅ VERIFIED' : '❌ NOT VERIFIED'}`);
    } else {
      console.log(`kyozo.com: ❌ NOT ADDED (needs to be added to Resend)`);
    }

    if (!contactDomain && !rootDomain) {
      console.log('\n⚠️  Neither domain is in your Resend account!');
      console.log('   You need to add them at https://resend.com/domains');
    }

  } catch (error) {
    console.error('❌ Error checking domains:', error.message);
    process.exit(1);
  }
}

checkDomains();
