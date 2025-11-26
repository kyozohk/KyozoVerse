
'use server';

import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Interfaces for data modeling
interface Community {
  id: string;
  name: string;
  memberCount: number;
  communityProfileImage?: string;
  owner: string;
}

interface Member {
  id: string;
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
  const query = search ? { _id: { $in: userOids }, name: { $regex: search, $options: 'i' } } : { _id: { $in: userOids } };
  const users = await db.collection('users').find(query).toArray();

  return users.map((user) => {
    let role: 'owner' | 'admin' | 'member' = 'member';
    if (community.owner.toString() === user._id.toString()) {
      role = 'owner';
    } else if (community.communityHandles?.some((h: any) => h.userId.toString() === user._id.toString() && h.role === 'admin')) {
      role = 'admin';
    }

    return {
      id: user._id.toString(),
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
