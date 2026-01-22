
'use server';

import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { adminAuth, adminFirestore, adminStorage, initAdmin, importAdminFirestore, importAdminStorage } from '@/firebase/admin-config';
import { randomBytes } from 'crypto';

// Initialize Firebase Admin
initAdmin();

// Helper function to migrate an image from source Firebase Storage to target Firebase Storage
async function migrateFirebaseStorageImage(sourceUrl: string | null | undefined): Promise<string | null> {
  if (!sourceUrl || !importAdminStorage || !adminStorage) {
    if (sourceUrl && (!importAdminStorage || !adminStorage)) {
      console.log(`[ImageMigration] Skipping migration (mock mode or storage not configured): ${sourceUrl}`);
    }
    return sourceUrl || null;
  }

  try {
    // Check if URL is from Firebase Storage
    const firebaseStoragePattern = /https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/([^\/]+)\/o\/([^?]+)/;
    const match = sourceUrl.match(firebaseStoragePattern);
    
    if (!match) {
      console.log(`[ImageMigration] URL is not a Firebase Storage URL, skipping: ${sourceUrl}`);
      return sourceUrl;
    }

    const [, sourceBucket, encodedPath] = match;
    const decodedPath = decodeURIComponent(encodedPath);
    
    console.log(`[ImageMigration] Migrating image from ${sourceBucket}: ${decodedPath}`);

    // Download from source bucket
    const sourceFile = importAdminStorage.bucket(sourceBucket).file(decodedPath);
    const [exists] = await sourceFile.exists();
    
    if (!exists) {
      console.log(`[ImageMigration] Source file does not exist: ${decodedPath}`);
      return sourceUrl;
    }

    const [fileBuffer] = await sourceFile.download();
    const [metadata] = await sourceFile.getMetadata();
    
    // Upload to target bucket with same path
    const targetBucket = adminStorage.bucket();
    const targetFile = targetBucket.file(decodedPath);
    
    await targetFile.save(fileBuffer, {
      metadata: {
        contentType: metadata.contentType || 'image/jpeg',
      },
    });

    // Make the file publicly accessible
    await targetFile.makePublic();
    
    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${targetBucket.name}/${decodedPath}`;
    
    console.log(`[ImageMigration] Successfully migrated image to: ${publicUrl}`);
    return publicUrl;
    
  } catch (error) {
    console.error(`[ImageMigration] Failed to migrate image ${sourceUrl}:`, error);
    return sourceUrl; // Return original URL as fallback
  }
}

// Interfaces for data modeling
interface Community {
  id: string;
  name: string;
  memberCount: number;
  communityProfileImage?: string;
  owner: string;
}

interface Member {
  id:string;
  userId: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
  email: string;
  photoURL?: string;
  phoneNumber?: string;
}

interface Message {
  id: string;
  text: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    avatar: string;
  };
}

// Server Action to get a raw document from any collection
export async function getRawDocument(collectionName: string, id: string): Promise<any> {
    const { db } = await connectToDatabase();
    const document = await db.collection(collectionName).findOne({ _id: new ObjectId(id) });
    return JSON.stringify(document, null, 2);
}

// Server Action to get all communities with search
export async function getCommunities(searchQuery: string = '') {
  const { db } = await connectToDatabase();
  const query = searchQuery ? { name: { $regex: searchQuery, $options: 'i' } } : {};
  const communities = await db.collection('communities').find(query).toArray();
  
  // Get all Firestore community handles in one query for efficiency
  const firestoreCommunities = await adminFirestore
    .collection('communities')
    .select('handle')
    .get();
  
  const exportedHandles = new Set(
    firestoreCommunities.docs.map(doc => doc.data().handle)
  );
  
  // Map MongoDB communities and check if they're exported
  const communityData = communities.map((c: any) => {
    const mongoId = c._id.toString();
    const isExported = exportedHandles.has(c.slug);
    
    return {
      id: mongoId,
      name: c.name,
      memberCount: c.memberCount || c.usersList?.length || 0,
      communityProfileImage: c.communityProfileImage,
      owner: c.owner?.toString() || 'Unknown',
      isExported,
    };
  });
  
  return communityData;
}

// Server Action to get members of a specific community with search
export async function getMembers(communityId: string, search: string = ''): Promise<Member[]> {
    const { db } = await connectToDatabase();
    const community = await db.collection('communities').findOne({ _id: new ObjectId(communityId) });
  
    if (!community) {
      return [];
    }
  
    const userOids = community.usersList.map((user: any) => new ObjectId(user.userId));
    
    let userQuery: any = { _id: { $in: userOids } };
    
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      userQuery = {
        ...userQuery,
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { fullName: searchRegex },
          { email: searchRegex },
        ],
      };
    }
    
    const users = await db.collection('users').find(userQuery).toArray();
  
    return users.map((user) => {
      let role: 'owner' | 'admin' | 'member' = 'member';
      if (community.owner.toString() === user._id.toString()) {
        role = 'owner';
      } else if (community.communityHandles?.some((h: any) => h.userId.toString() === user._id.toString() && h.role === 'admin')) {
        role = 'admin';
      }
  
      return {
        id: user._id.toString(),
        userId: user._id.toString(),
        name: user.displayName || user.fullName,
        role,
        email: user.email,
        photoURL: user.photoURL || user.profileImage,
        phoneNumber: user.phoneNumber,
      };
    });
}
  

// Server Action to get direct messages for a member in a community with search
export async function getMessagesForMember(communityId: string, memberId: string, search: string = ''): Promise<Message[]> {
  const { db } = await connectToDatabase();

  const channel = await db.collection('channels').findOne({
    community: new ObjectId(communityId),
    user: new ObjectId(memberId),
  });

  if (!channel) {
    return [];
  }

  const query = search ? { channel: channel._id, text: { $regex: search, $options: 'i' } } : { channel: channel._id };

  const messages = await db.collection('messages').aggregate([
    { $match: query },
    { $sort: { createdAt: -1 } },
    { $limit: 100 },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'senderInfo'
      }
    },
    {
        $unwind: '$senderInfo'
    }
  ]).toArray();

  return messages.map((msg) => ({
    id: msg._id.toString(),
    text: msg.text,
    createdAt: msg.createdAt.toISOString(),
    sender: {
      id: msg.senderInfo._id.toString(),
      name: msg.senderInfo.displayName || msg.senderInfo.fullName,
      avatar: msg.senderInfo.photoURL || msg.senderInfo.profileImage || 'https://static.productionready.io/images/smiley-cyrus.jpg',
    },
  }));
}

export async function getCommunityExportData(communityId: string) {
    const { db } = await connectToDatabase();
  
    // 1. Fetch the community
    const community = await db.collection('communities').findOne({ _id: new ObjectId(communityId) });
    if (!community) {
      throw new Error('Community not found');
    }
  
    // 2. Fetch all members of the community
    const memberIds = community.usersList.map((u: any) => u.userId);
    const ownerId = community.owner?.toString();

    // Ensure the owner is also included in the member list even if not present in usersList
    if (ownerId && !memberIds.includes(ownerId)) {
      memberIds.push(ownerId);
    }

    const memberObjectIds = memberIds.map((id: string) => new ObjectId(id));
    const members = await db.collection('users').find({ _id: { $in: memberObjectIds } }).toArray();
  
    // 3. Enrich member data from the import Firebase project (kyozo-prod)
    console.log('[Exporter] Enriching user data from import Firebase project...');
    const enrichedMembers = await Promise.all(
      members.map(async (member) => {
        let enrichedMember = { ...member };
        
        // Try to fetch user data from import Firebase project by mongoId
        if (importAdminFirestore) {
          try {
            const mongoId = member._id.toString();
            const importUserSnapshot = await importAdminFirestore
              .collection('users')
              .where('mongoId', '==', mongoId)
              .limit(1)
              .get();
            
            if (!importUserSnapshot.empty) {
              const importUserData = importUserSnapshot.docs[0].data();
              console.log(`[Exporter] Found Firebase user data for Mongo ID ${mongoId}`);
              
              // Merge Firebase data with Mongo data, preferring Firebase data
              enrichedMember = {
                ...member,
                email: importUserData.email || member.email,
                fullName: importUserData.displayName || member.fullName,
                firstName: importUserData.firstName || member.firstName,
                lastName: importUserData.lastName || member.lastName,
                profileImage: importUserData.avatarUrl || member.profileImage,
                coverUrl: importUserData.coverUrl || member.coverUrl,
                bio: importUserData.bio || member.bio || '',
                phoneNumber: importUserData.phone || member.phoneNumber,
                firebaseUid: importUserSnapshot.docs[0].id, // Store original Firebase UID
              };
            } else {
              console.log(`[Exporter] No Firebase user found for Mongo ID ${mongoId}, using Mongo data only`);
            }
          } catch (error) {
            console.error(`[Exporter] Error fetching Firebase data for member ${member._id}:`, error);
          }
        }
        
        return enrichedMember;
      })
    );
  
    // 4. For each member, fetch their messages in this community
    const membersWithMessages = await Promise.all(
      enrichedMembers.map(async (member) => {
        const memberIdString = member._id.toString();
        const messages = await getMessagesForMember(communityId, memberIdString);
        return {
          ...member,
          messages,
        };
      })
    );

    return JSON.parse(JSON.stringify({
      community,
      members: membersWithMessages,
    }));
  }


export async function importCommunityToFirebase(data: any): Promise<{ success: boolean; message: string; communityId?: string }> {
  const { community: mongoCommunity, members: mongoMembers } = data;
  const ownerMongoId = mongoCommunity.owner.toString();
  const userMap = new Map<string, string>(); // Maps mongoId to firebaseUID
  
  // Use dev@kyozo.com as the owner for all imported communities
  const IMPORT_OWNER_EMAIL = 'dev@kyozo.com';
  let importOwnerUid: string;

  console.log(`[Importer] Starting import for community: "${mongoCommunity.name}"`);

  try {
    // Step 0: Ensure import owner (dev@kyozo.com) exists
    console.log(`[Importer] Step 0: Ensuring import owner ${IMPORT_OWNER_EMAIL} exists...`);
    try {
      const ownerRecord = await adminAuth.getUserByEmail(IMPORT_OWNER_EMAIL);
      importOwnerUid = ownerRecord.uid;
      console.log(`[Importer]   - Found existing owner with UID: ${importOwnerUid}`);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // Create the import owner account
        const ownerRecord = await adminAuth.createUser({
          email: IMPORT_OWNER_EMAIL,
          password: randomBytes(16).toString('hex'),
          displayName: 'Kyozo Dev',
        });
        importOwnerUid = ownerRecord.uid;
        
        // Create Firestore user document
        await adminFirestore.collection('users').doc(importOwnerUid).set({
          userId: importOwnerUid,
          email: IMPORT_OWNER_EMAIL,
          displayName: 'Kyozo Dev',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`[Importer]   - Created new owner account with UID: ${importOwnerUid}`);
      } else {
        throw error;
      }
    }
    
    // Step 1: Create/update users in Firebase Auth and Firestore 'users' collection
    console.log(`[Importer] Step 1: Processing ${mongoMembers.length} members...`);
    for (const member of mongoMembers) {
      const mongoId = member._id.toString();
      const memberEmail = member.email || `${mongoId}@example.com`;
      let firebaseUid: string;
      let userAlreadyExists = false;
      
      console.log(`[Importer] - Processing member: ${member.fullName} (${memberEmail})`);

      // First, check if user already exists in Firestore by mongoId
      const existingUserByMongoId = await adminFirestore.collection('users')
        .where('mongoId', '==', mongoId)
        .limit(1)
        .get();
      
      if (!existingUserByMongoId.empty) {
        // User already exists with this mongoId
        const existingUserDoc = existingUserByMongoId.docs[0];
        firebaseUid = existingUserDoc.data().userId;
        userAlreadyExists = true;
        console.log(`[Importer]   - Found existing user in Firestore by mongoId with UID: ${firebaseUid}`);
      } else {
        // Check if user exists by email
        const existingUserByEmail = await adminFirestore.collection('users')
          .where('email', '==', memberEmail)
          .limit(1)
          .get();
        
        if (!existingUserByEmail.empty) {
          // User already exists with this email
          const existingUserDoc = existingUserByEmail.docs[0];
          firebaseUid = existingUserDoc.data().userId;
          userAlreadyExists = true;
          console.log(`[Importer]   - Found existing user in Firestore by email with UID: ${firebaseUid}`);
          
          // Update the existing user document to add mongoId if missing
          await adminFirestore.collection('users').doc(firebaseUid).update({
            mongoId: mongoId,
            updatedAt: new Date(),
          });
          console.log(`[Importer]   - Added mongoId to existing user document`);
        } else {
          // User doesn't exist in Firestore, create new Firebase Auth user
          try {
            const userRecord = await adminAuth.createUser({
              email: memberEmail,
              password: randomBytes(16).toString('hex'),
              displayName: member.fullName || `${member.firstName} ${member.lastName}`,
              photoURL: member.profileImage || member.communityProfileImage,
            });
            firebaseUid = userRecord.uid;
            console.log(`[Importer]   - Created new Firebase Auth user with UID: ${firebaseUid}`);
          } catch (error: any) {
            if (error.code === 'auth/email-already-exists') {
              const userRecord = await adminAuth.getUserByEmail(memberEmail);
              firebaseUid = userRecord.uid;
              console.log(`[Importer]   - Found existing Firebase Auth user with UID: ${firebaseUid}`);
            } else {
              throw new Error(`Failed to create auth user for ${memberEmail}: ${error.message}`);
            }
          }
        }
      }

      userMap.set(mongoId, firebaseUid);

      // Only migrate images and create/update user document if user is new or needs updating
      if (!userAlreadyExists) {
        // Migrate user images from source Firebase Storage to target
        console.log(`[Importer]   - Migrating user images...`);
        const migratedAvatarUrl = await migrateFirebaseStorageImage(member.profileImage);
        const migratedCoverUrl = await migrateFirebaseStorageImage(member.coverUrl);

        const userDocRef = adminFirestore.collection('users').doc(firebaseUid);
        await userDocRef.set({
          userId: firebaseUid,
          mongoId: mongoId,
          email: memberEmail,
          displayName: member.fullName,
          firstName: member.firstName,
          lastName: member.lastName,
          avatarUrl: migratedAvatarUrl || '',
          coverUrl: migratedCoverUrl || '',
          bio: member.bio || '',
          phone: member.phoneNumber || '',
          createdAt: new Date(member.createdAt),
          updatedAt: new Date(member.updatedAt),
        }, { merge: true });
        console.log(`[Importer]   - Created Firestore user document with enriched data and migrated images.`);
      } else {
        console.log(`[Importer]   - Reusing existing user, skipping image migration and document creation.`);
      }
    }
    console.log('[Importer] Step 1 Complete: All members processed.');

    // Step 2: Create the community document in Firestore
    console.log('[Importer] Step 2: Creating community document...');
    const newCommunityRef = adminFirestore.collection('communities').doc();

    // Use importOwnerUid (dev@kyozo.com) as the owner instead of original owner
    console.log(`[Importer]   - Setting owner to ${IMPORT_OWNER_EMAIL} (${importOwnerUid})`);

    // Migrate community images from source Firebase Storage to target
    console.log('[Importer] Step 2: Migrating community images...');
    const migratedProfileImage = await migrateFirebaseStorageImage(mongoCommunity.communityProfileImage);
    const migratedBackgroundImage = await migrateFirebaseStorageImage(mongoCommunity.communityBackgroundImage);

    await newCommunityRef.set({
      name: mongoCommunity.name,
      handle: mongoCommunity.slug,
      ownerId: importOwnerUid,
      tagline: mongoCommunity.tagline,
      lore: mongoCommunity.lore,
      mantras: mongoCommunity.mantras,
      communityPrivacy: mongoCommunity.communityPrivacy,
      communityProfileImage: migratedProfileImage || '',
      communityBackgroundImage: migratedBackgroundImage || '',
      tags: mongoCommunity.tags,
      location: mongoCommunity.location,
      colorPalette: mongoCommunity.colorPalette,
      createdAt: new Date(mongoCommunity.createdAt),
      memberCount: mongoMembers.length,
    });
    console.log(`[Importer] Step 2 Complete: Community created with ID: ${newCommunityRef.id}`);

    // Step 3: Create member documents in the 'communityMembers' collection
    console.log(`[Importer] Step 3: Creating ${mongoMembers.length + 1} community member links (including owner)...`);
    const batch = adminFirestore.batch();
    
    // Add the import owner as the community owner
    const ownerMemberRef = adminFirestore.collection('communityMembers').doc();
    batch.set(ownerMemberRef, {
      userId: importOwnerUid,
      communityId: newCommunityRef.id,
      role: 'owner',
      status: 'active',
      joinedAt: new Date(),
      userDetails: {
        displayName: 'Kyozo Dev',
        email: IMPORT_OWNER_EMAIL,
        avatarUrl: '',
        phone: '',
      }
    });
    
    // Add all other members as regular members
    for (const member of mongoMembers) {
      const mongoId = member._id.toString();
      const firebaseUid = userMap.get(mongoId);
      if (firebaseUid) {
        const memberRef = adminFirestore.collection('communityMembers').doc();
        batch.set(memberRef, {
          userId: firebaseUid,
          communityId: newCommunityRef.id,
          role: 'member', // All imported users are members, not owners
          status: 'active',
          joinedAt: new Date(member.createdAt),
          userDetails: {
            displayName: member.fullName || '',
            email: member.email || '',
            avatarUrl: member.profileImage || '',
            phone: member.phoneNumber || '',
          }
        });
      }
    }
    await batch.commit();
    console.log('[Importer] Step 3 Complete: Member documents created.');

    console.log(`[Importer] ✅ Import successful for community "${mongoCommunity.name}"!`);
    return { success: true, message: 'Community imported successfully!', communityId: newCommunityRef.id };
  } catch (error: any) {
    console.error("[Importer] ❌ Import failed:", error);
    return { success: false, message: error.message };
  }
}
