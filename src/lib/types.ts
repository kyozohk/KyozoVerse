
export type User = {
  userId: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  coverUrl?: string;
  bio?: string;
  tags?: string[];
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  handle?: string;
};

export type UserRole = 'owner' | 'admin' | 'member' | 'guest';

export type Community = {
  communityId: string;
  name: string;
  handle: string;
  tagline?: string;
  communityProfileImage?: string;
  memberCount: number;
  ownerId: string;
  description?: string;
  isPrivate?: boolean;
};

export type CommunityMember = {
  userId: string;
  communityId: string;
  role: UserRole;
  joinedAt: any; // Firestore Timestamp
  status: 'active' | 'pending' | 'banned';
  userDetails?: {
    displayName?: string;
    avatarUrl?: string;
    email?: string;
  };
};

export type Post = {
  id?: string;
  postId: string;
  title?: string;
  type: "text" | "image" | "audio" | "video" | "poll";
  content: {
    text?: string;
    mediaUrls?: string[];
  };
  authorId: string;
  author: User; // Denormalized author data
  communityHandle: string;
  communityId?: string;
  likes: number;
  comments: number;
  createdAt: any; // Firestore Timestamp
  visibility: 'public' | 'private' | 'members-only';
};
