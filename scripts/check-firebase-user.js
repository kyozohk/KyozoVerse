/**
 * Check if a Firebase Auth user exists for a given email.
 * If no user exists, Firebase will silently "accept" password reset requests
 * but never send an email (especially with Email Enumeration Protection enabled).
 *
 * Usage:
 *   node scripts/check-firebase-user.js ashok@kyozo.com
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const admin = require('firebase-admin');

function initAdmin() {
  if (admin.apps.length) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';

  if (!projectId || !clientEmail || !privateKey) {
    // Fallback: try FIREBASE_SERVICE_ACCOUNT_KEY
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (raw) {
      const sa = JSON.parse(raw);
      admin.initializeApp({ credential: admin.credential.cert(sa) });
      return;
    }
    console.error('❌ Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY in env.');
    process.exit(1);
  }

  privateKey = privateKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
}

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node scripts/check-firebase-user.js <email>');
    process.exit(1);
  }

  initAdmin();

  try {
    const user = await admin.auth().getUserByEmail(email);
    console.log('✅ Firebase Auth user found:');
    console.log('   uid:', user.uid);
    console.log('   email:', user.email);
    console.log('   emailVerified:', user.emailVerified);
    console.log('   disabled:', user.disabled);
    console.log('   providers:', user.providerData.map((p) => p.providerId).join(', '));
    console.log('   createdAt:', user.metadata.creationTime);
    console.log('   lastSignIn:', user.metadata.lastSignInTime);
    console.log('\n➡️  Reset email SHOULD be sent. Check spam/promotions folder.');
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.log('❌ No Firebase Auth user exists for', email);
      console.log('   This is why no reset email arrives — Firebase silently accepts');
      console.log('   the request when Email Enumeration Protection is enabled.');
    } else {
      console.error('❌ Error:', err.code, err.message);
    }
  }
}

main();
