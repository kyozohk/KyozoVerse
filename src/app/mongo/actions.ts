
'use server';

import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { adminAuth, adminFirestore, initAdmin } from '@/firebase/admin-config';
import { randomBytes } from 'crypto';

// Initialize Firebase Admin
initAdmin();

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
export async function getCommunities(search: string = ''): Promise<Community[]> {
  const { db } = await connectToDatabase();
  const query = search ? { name: { $regex: search, $options: 'i' } } : {};
  const communities = await db.collection('communities').find(query).sort({ name: 1 }).toArray();

  return communities.map((community) => ({
    id: community._id.toString(),
    name: community.name,
    memberCount: community.usersList?.length || 0,
    communityProfileImage: community.communityProfileImage,
    owner: community.owner.toString(),
  }));
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
    const memberObjectIds = memberIds.map((id: string) => new ObjectId(id));
    const members = await db.collection('users').find({ _id: { $in: memberObjectIds } }).toArray();
  
    // 3. For each member, fetch their messages in this community
    const membersWithMessages = await Promise.all(
      members.map(async (member) => {
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

  console.log(`[Importer] Starting import for community: "${mongoCommunity.name}"`);

  try {
    // Step 1: Create/update users in Firebase Auth and Firestore 'users' collection
    console.log(`[Importer] Step 1: Processing ${mongoMembers.length} members...`);
    for (const member of mongoMembers) {
      const mongoId = member._id.toString();
      const memberEmail = member.email || `${mongoId}@example.com`;
      let firebaseUid: string;
      
      console.log(`[Importer] - Processing member: ${member.fullName} (${memberEmail})`);

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

      userMap.set(mongoId, firebaseUid);

      const userDocRef = adminFirestore.collection('users').doc(firebaseUid);
      await userDocRef.set({
        userId: firebaseUid,
        mongoId: mongoId,
        email: memberEmail,
        displayName: member.fullName,
        firstName: member.firstName,
        lastName: member.lastName,
        avatarUrl: member.profileImage,
        coverUrl: member.coverUrl || '',
        bio: '',
        createdAt: new Date(member.createdAt),
        updatedAt: new Date(member.updatedAt),
      }, { merge: true });
      console.log(`[Importer]   - Upserted Firestore user document.`);
    }
    console.log('[Importer] Step 1 Complete: All members processed.');

    // Step 2: Create the community document in Firestore
    console.log('[Importer] Step 2: Creating community document...');
    const newCommunityRef = adminFirestore.collection('communities').doc();
    const ownerFirebaseUid = userMap.get(ownerMongoId);

    if (!ownerFirebaseUid) {
      throw new Error(`Owner with Mongo ID ${ownerMongoId} was not found in the processed user map.`);
    }

    await newCommunityRef.set({
      name: mongoCommunity.name,
      handle: mongoCommunity.slug,
      ownerId: ownerFirebaseUid,
      tagline: mongoCommunity.tagline,
      lore: mongoCommunity.lore,
      mantras: mongoCommunity.mantras,
      communityPrivacy: mongoCommunity.communityPrivacy,
      communityProfileImage: mongoCommunity.communityProfileImage,
      communityBackgroundImage: mongoCommunity.communityBackgroundImage,
      tags: mongoCommunity.tags,
      location: mongoCommunity.location,
      colorPalette: mongoCommunity.colorPalette,
      createdAt: new Date(mongoCommunity.createdAt),
      memberCount: mongoMembers.length,
    });
    console.log(`[Importer] Step 2 Complete: Community created with ID: ${newCommunityRef.id}`);

    // Step 3: Create member documents in the 'communityMembers' collection
    console.log(`[Importer] Step 3: Creating ${mongoMembers.length} community member links...`);
    const batch = adminFirestore.batch();
    for (const member of mongoMembers) {
      const mongoId = member._id.toString();
      const firebaseUid = userMap.get(mongoId);
      if (firebaseUid) {
        const memberRef = adminFirestore.collection('communityMembers').doc(); // Auto-generate ID
        batch.set(memberRef, {
          userId: firebaseUid,
          communityId: newCommunityRef.id,
          role: mongoId === ownerMongoId ? 'owner' : 'member',
          status: 'active',
          joinedAt: new Date(member.createdAt),
          userDetails: {
            displayName: member.fullName,
            email: member.email,
            avatarUrl: member.profileImage,
            phone: member.phoneNumber,
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
