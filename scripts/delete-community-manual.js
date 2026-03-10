/**
 * Manual Community Deletion Script
 * 
 * Usage: node scripts/delete-community-manual.js <community-handle>
 * Example: node scripts/delete-community-manual.js willer2
 * 
 * This script will delete a community and all associated data:
 * - Community document
 * - All community members (associations only, not user accounts)
 * - All posts and content
 * - Email domain configuration
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });
}

const db = admin.firestore();

async function deleteCommunity(handle) {
  console.log(`\n🔍 Looking for community: ${handle}\n`);
  
  try {
    // Find community by handle
    const communitiesRef = db.collection('communities');
    const communityQuery = await communitiesRef.where('handle', '==', handle).get();
    
    if (communityQuery.empty) {
      console.error(`❌ Community "${handle}" not found.`);
      process.exit(1);
    }
    
    const communityDoc = communityQuery.docs[0];
    const community = communityDoc.data();
    const communityId = community.communityId;
    
    console.log(`✓ Found community: ${community.name}`);
    console.log(`  ID: ${communityId}`);
    console.log(`  Owner: ${community.ownerId}`);
    console.log(`  Members: ${community.memberCount || 0}\n`);
    
    // Get all members
    const membersRef = db.collection('communityMembers');
    const membersQuery = await membersRef.where('communityId', '==', communityId).get();
    console.log(`📊 Found ${membersQuery.size} member associations\n`);
    
    // Get all posts
    const postsRef = db.collection('blogs');
    const postsQuery = await postsRef.where('communityId', '==', communityId).get();
    console.log(`📝 Found ${postsQuery.size} posts\n`);
    
    // Confirm deletion
    console.log(`⚠️  WARNING: This will permanently delete:`);
    console.log(`   - Community: ${community.name}`);
    console.log(`   - ${membersQuery.size} member associations`);
    console.log(`   - ${postsQuery.size} posts`);
    console.log(`   - Email domain: ${handle}.kyozo.com\n`);
    
    console.log(`🗑️  Starting deletion process...\n`);
    
    // Delete all posts
    console.log(`Deleting ${postsQuery.size} posts...`);
    const batch1 = db.batch();
    postsQuery.docs.forEach(doc => {
      batch1.delete(doc.ref);
    });
    await batch1.commit();
    console.log(`✓ Deleted ${postsQuery.size} posts\n`);
    
    // Delete all member associations
    console.log(`Deleting ${membersQuery.size} member associations...`);
    const batch2 = db.batch();
    membersQuery.docs.forEach(doc => {
      batch2.delete(doc.ref);
    });
    await batch2.commit();
    console.log(`✓ Deleted ${membersQuery.size} member associations\n`);
    
    // Delete community document
    console.log(`Deleting community document...`);
    await communityDoc.ref.delete();
    console.log(`✓ Deleted community document\n`);
    
    // Try to delete email domain (optional, may fail if not configured)
    try {
      console.log(`Attempting to delete email domain...`);
      const domainResponse = await fetch('http://localhost:9003/api/delete-community-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle }),
      });
      const result = await domainResponse.json();
      console.log(`✓ Email domain cleanup result:`, result);
    } catch (error) {
      console.log(`⚠️  Email domain cleanup failed (this is optional):`, error.message);
    }
    
    console.log(`\n✅ Community "${handle}" has been successfully deleted!\n`);
    process.exit(0);
    
  } catch (error) {
    console.error(`\n❌ Error deleting community:`, error);
    process.exit(1);
  }
}

// Get community handle from command line arguments
const handle = process.argv[2];

if (!handle) {
  console.error(`\n❌ Usage: node scripts/delete-community-manual.js <community-handle>`);
  console.error(`   Example: node scripts/delete-community-manual.js willer2\n`);
  process.exit(1);
}

// Run deletion
deleteCommunity(handle);
