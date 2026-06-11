'use client';

/**
 * Dev preview for the mobile feed card (mirrors kyozo_flutter's PostCard).
 * Visit /dev/mobile-feed at a narrow viewport. Mock data only — no Firestore.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import {
  MobilePostCard,
  MobileFeedFilterBar,
  matchesMobileFeedFilter,
  type MobileFeedFilter,
} from '@/components/community/feed/mobile-post-card';
import { type Post } from '@/lib/types';

const author = {
  userId: 'u1',
  displayName: 'Ashok Jaiswal',
  avatarUrl: '',
} as any;

const ts = (daysAgo: number) => ({
  toDate: () => new Date(Date.now() - daysAgo * 86400000),
});

const MOCK_POSTS: (Post & { id: string })[] = [
  {
    id: 'p1',
    postId: 'p1',
    type: 'text',
    title: 'Welcome to the Loop',
    content: { text: 'This is what a text post looks like on mobile. It is capped at four lines, mirroring the Flutter card, so longer essays show a teaser here and open in full when tapped. Anything beyond the cap is truncated with an ellipsis.' },
    authorId: 'u1',
    author,
    communityHandle: 'demo',
    likes: 12,
    comments: 3,
    createdAt: ts(1),
    visibility: 'public',
  },
  {
    id: 'p2',
    postId: 'p2',
    type: 'text',
    title: 'Night Rain',
    content: { text: 'soft rain on the window\na city hums beneath the clouds\nwe stay in the warm' },
    authorId: 'u1',
    author,
    communityHandle: 'demo',
    likes: 4,
    comments: 0,
    createdAt: ts(2),
    visibility: 'private',
    isPoetry: true,
  },
  {
    id: 'p3',
    postId: 'p3',
    type: 'image',
    title: 'From last night',
    content: {
      text: 'A few shots from the show.',
      mediaUrls: ['https://picsum.photos/seed/kyozo-img/800/800'],
    },
    authorId: 'u1',
    author,
    communityHandle: 'demo',
    likes: 31,
    comments: 7,
    createdAt: ts(3),
    visibility: 'public',
  },
  {
    id: 'p4',
    postId: 'p4',
    type: 'audio',
    title: 'Episode 12 — On Community',
    content: {
      text: 'We talk about what makes small communities stick together.',
      mediaUrls: ['https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'],
    },
    authorId: 'u1',
    author,
    communityHandle: 'demo',
    likes: 8,
    comments: 1,
    createdAt: ts(4),
    visibility: 'public',
  },
  {
    id: 'p5',
    postId: 'p5',
    type: 'video',
    title: 'Rehearsal clip',
    content: {
      mediaUrls: ['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'],
      thumbnailUrl: 'https://picsum.photos/seed/kyozo-vid/800/450',
    },
    authorId: 'u1',
    author,
    communityHandle: 'demo',
    likes: 19,
    comments: 0,
    createdAt: ts(5),
    visibility: 'private',
  },
];

export default function MobileFeedPreviewPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<MobileFeedFilter>('all');
  const posts = MOCK_POSTS.filter(p => matchesMobileFeedFilter(p, filter));

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden" style={{ backgroundColor: 'var(--page-content-bg)' }}>
      {/* Same back header the community layout renders on real nav pages */}
      <header
        className="flex h-14 flex-shrink-0 items-center gap-1 border-b px-2"
        style={{ backgroundColor: 'hsl(var(--sidebar-background))' }}
      >
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent"
          aria-label="Back"
        >
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </button>
        <span className="truncate text-base font-semibold text-foreground">Feed</span>
      </header>
      <div className="mx-auto w-full max-w-md flex-1 overflow-y-auto p-3">
        <div className="sticky top-0 z-10 pb-3 pt-1" style={{ backgroundColor: 'var(--page-content-bg)' }}>
          <MobileFeedFilterBar value={filter} onChange={setFilter} />
        </div>
        <div className="flex flex-col gap-3 pb-6">
          {posts.map(post => (
            <MobilePostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
}
