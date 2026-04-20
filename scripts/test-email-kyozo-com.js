/**
 * Test script to send email from delete@kyozo.com
 * 
 * Usage: node scripts/test-email-kyozo-com.js
 */

require('dotenv').config();

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY not set in .env');
  process.exit(1);
}

async function sendTestEmail() {
  console.log('📧 Testing email from delete@kyozo.com...\n');
  console.log('='.repeat(60));
  console.log();

  const testPayload = {
    from: 'Kyozo <delete@kyozo.com>',
    to: 'ashok@kyozo.com',
    subject: '🔧 Test Email from delete@kyozo.com',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #5B4A3A;">Test Email</h2>
        <p>This is a test email sent from <code>delete@kyozo.com</code> via Resend.</p>
        <p>If you received this, the domain is properly verified!</p>
        <hr style="border: none; border-top: 1px solid #E8DFD1; margin: 20px 0;">
        <p style="color: #6B5D52; font-size: 12px;">
          Sent at: ${new Date().toISOString()}<br>
          From: delete@kyozo.com<br>
          To: ashok@kyozo.com
        </p>
      </div>
    `,
  };

  console.log('📝 Payload:');
  console.log(JSON.stringify(testPayload, null, 2));
  console.log();

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    const data = await response.json().catch(() => null);

    console.log('📬 Response:');
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   OK: ${response.ok}`);
    
    if (data) {
      console.log(`   Data: ${JSON.stringify(data, null, 2)}`);
    }
    console.log();

    if (response.ok) {
      console.log('✅ SUCCESS! Email sent from delete@kyozo.com');
      console.log(`   Email ID: ${data?.id}`);
      console.log();
      console.log('📧 Check your inbox at ashok@kyozo.com');
    } else {
      console.log('❌ FAILED to send email');
      if (data?.message) {
        console.log(`   Error: ${data.message}`);
        
        if (data.message.includes('not verified')) {
          console.log();
          console.log('⚠️  The kyozo.com domain is NOT verified in Resend.');
          console.log('   You need to verify it at https://resend.com/domains');
        }
      }
    }

    console.log();
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

sendTestEmail();
