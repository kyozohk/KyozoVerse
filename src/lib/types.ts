export type User = {
  userId: string;
  email?: string;
  handle?: string;
  displayName?: string;
  avatarUrl?: string;
  coverUrl?: string;
  bio?: string;
  tags?: string[];
};

export type Community = {
  communityId: string;
  name: string;
  slug: string;
  tagline?: string;
  communityProfileImage?: string;
  memberCount: number;
};

export type Post = {
  postId: string;
  type: "text" | "image" | "audio" | "video" | "poll";
  content: {
    text?: string;
    mediaUrls?: string[];
  };
  authorId: string;
  author: User; // Denormalized author data
  likes: number;
  comments: number;
  createdAt: any; // Firestore Timestamp
  visibility: 'public' | 'private' | 'members-only';
};
