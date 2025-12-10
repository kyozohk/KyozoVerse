/**
 * Migration script to assign existing communities to dev@kyozo.com and will@kyozo.com
 * 
 * This script:
 * 1. Finds the UIDs for dev@kyozo.com and will@kyozo.com
 * 2. Updates all existing communities to be owned by these two users
 * 3. Ensures both users are added as owners in the communityMembers collection
 * 
 * Usage: npx tsx scripts/migrate-community-ownership.ts
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin
if (getApps().length === 0) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
  
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const auth = getAuth();
const db = getFirestore();

const OWNER_EMAILS = ['dev@kyozo.com', 'will@kyozo.com'];

async function migrateCommunityOwnership() {
  console.log('🚀 Starting community ownership migration...\n');

  try {
    // Step 1: Get UIDs for the owner emails
    console.log('Step 1: Finding UIDs for owner emails...');
    const ownerUids: string[] = [];
    
    for (const email of OWNER_EMAILS) {
      try {
        const userRecord = await auth.getUserByEmail(email);
        ownerUids.push(userRecord.uid);
        console.log(`  ✓ Found ${email}: ${userRecord.uid}`);
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          console.log(`  ⚠️  User ${email} not found - skipping`);
        } else {
          throw error;
        }
      }
    }

    if (ownerUids.length === 0) {
      console.error('❌ No owner users found. Please ensure dev@kyozo.com and/or will@kyozo.com exist.');
      return;
    }

    console.log(`\n✓ Found ${ownerUids.length} owner(s)\n`);

    // Step 2: Get all communities
    console.log('Step 2: Fetching all communities...');
    const communitiesSnapshot = await db.collection('communities').get();
    console.log(`  Found ${communitiesSnapshot.size} communities\n`);

    if (communitiesSnapshot.empty) {
      console.log('No communities to migrate.');
      return;
    }

    // Step 3: Update each community
    console.log('Step 3: Updating community ownership...');
    const batch = db.batch();
    let updateCount = 0;

    // We'll assign communities alternately between the two owners
    // or just to the first owner if only one exists
    for (let i = 0; i < communitiesSnapshot.docs.length; i++) {
      const communityDoc = communitiesSnapshot.docs[i];
      const communityData = communityDoc.data();
      const ownerIndex = i % ownerUids.length;
      const newOwnerId = ownerUids[ownerIndex];

      console.log(`  Updating "${communityData.name}" (${communityDoc.id})`);
      console.log(`    Current owner: ${communityData.ownerId || 'none'}`);
      console.log(`    New owner: ${newOwnerId} (${OWNER_EMAILS[ownerIndex]})`);

      // Update the community document
      batch.update(communityDoc.ref, {
        ownerId: newOwnerId,
        updatedAt: new Date(),
      });

      updateCount++;
    }

    // Commit the batch
    await batch.commit();
    console.log(`\n✓ Updated ${updateCount} communities\n`);

    // Step 4: Ensure owners are in communityMembers collection
    console.log('Step 4: Ensuring owners are in communityMembers collection...');
    
    for (const communityDoc of communitiesSnapshot.docs) {
      const communityId = communityDoc.id;
      const communityData = communityDoc.data();
      const newOwnerId = communityData.ownerId;

      // Check if owner is already a member
      const memberQuery = await db.collection('communityMembers')
        .where('userId', '==', newOwnerId)
        .where('communityId', '==', communityId)
        .limit(1)
        .get();

      if (memberQuery.empty) {
        // Get owner details
        const ownerRecord = await auth.getUser(newOwnerId);
        const ownerUserDoc = await db.collection('users').doc(newOwnerId).get();
        const ownerUserData = ownerUserDoc.data();

        // Add owner as a member
        await db.collection('communityMembers').add({
          userId: newOwnerId,
          communityId: communityId,
          role: 'owner',
          status: 'active',
          joinedAt: new Date(),
          userDetails: {
            displayName: ownerUserData?.displayName || ownerRecord.displayName || 'Unknown',
            email: ownerUserData?.email || ownerRecord.email || '',
            avatarUrl: ownerUserData?.avatarUrl || ownerRecord.photoURL || '',
            phone: ownerUserData?.phone || ownerRecord.phoneNumber || '',
          }
        });

        console.log(`  ✓ Added ${ownerRecord.email} as owner member of "${communityData.name}"`);
      } else {
        // Update existing member to owner role
        const memberDoc = memberQuery.docs[0];
        await memberDoc.ref.update({
          role: 'owner',
          status: 'active',
        });
        console.log(`  ✓ Updated ${OWNER_EMAILS.find(e => e.includes(newOwnerId.substring(0, 3)))} to owner role in "${communityData.name}"`);
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\nSummary:');
    console.log(`  - Communities updated: ${updateCount}`);
    console.log(`  - Owners: ${OWNER_EMAILS.join(', ')}`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
migrateCommunityOwnership()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
