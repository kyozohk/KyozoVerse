
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { FeedSkeletons } from '@/components/community/feed/skeletons';
import { getCommunityByHandle } from '@/lib/community-utils';
import { type Post, type Community } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { CustomButton } from '@/components/ui';
import { useCommunityAuth } from '@/hooks/use-community-auth';
import { useRouter } from 'next/navigation';
import { ReadCard } from '@/components/content-cards/read-card';
import { ListenCard } from '@/components/content-cards/listen-card';
import { WatchCard } from '@/components/content-cards/watch-card';
import '@/components/content-cards/content-cards.css';

export default function WillerFeedPreviewPage() {
  const router = useRouter();
  const handle = 'willer'; // Hardcoded for this preview page

  const [posts, setPosts] = useState<(Post & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [communityData, setCommunityData] = useState<Community | null>(null);
  const { user: communityUser, signOut } = useCommunityAuth();

  useEffect(() => {
    async function fetchCommunityData() {
      if (!handle) return;
      setLoading(true);
      try {
        const data = await getCommunityByHandle(handle);
        setCommunityData(data);
      } catch (error) {
        console.error('Error fetching community data:', error);
      }
    }
    fetchCommunityData();
  }, [handle]);

  useEffect(() => {
    if (!handle) return;

    const postsRef = collection(db, 'blogs');
    const publicQuery = query(
      postsRef,
      where('communityHandle', '==', handle),
      where('visibility', '==', 'public'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(publicQuery, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (Post & { id: string })[];
      
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching posts:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [handle]);

  const renderPost = (post: Post & { id: string }) => {
    const readTime = post.content?.text ? `${Math.max(1, Math.ceil((post.content.text.length || 0) / 1000))} min read` : '1 min read';
    const postDate = post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', year: '2024' }) : 'Dec 2024';

    switch (post.type) {
      case 'text':
      case 'image':
        return (
          <ReadCard
            key={post.id}
            category={post.type === 'image' ? 'Image' : 'Text'}
            readTime={readTime}
            date={postDate}
            title={post.title || 'Untitled'}
            summary={post.content.text}
          />
        );
      case 'audio':
        return (
          <ListenCard
            key={post.id}
            category="Audio"
            episode="Listen"
            duration="0:00"
            title={post.title || 'Untitled Audio'}
            summary={post.content.text}
          />
        );
      case 'video':
        return (
          <WatchCard
            key={post.id}
            category="Video"
            title={post.title || 'Untitled Video'}
            imageUrl={post.content.mediaUrls?.[0] || 'https://picsum.photos/seed/video-placeholder/800/600'}
            imageHint="video content"
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="sticky top-0 z-50 relative w-full bg-[rgba(245,241,232,0.15)] backdrop-blur-sm border-b border-[rgba(79,91,102,0.08)]">
        <div className="flex flex-row items-center w-full">
          <div className="content-stretch flex items-center justify-between px-4 md:px-8 lg:px-12 py-3 md:py-3.5 lg:py-4 relative w-full">
            <p className="font-['DM_Sans',sans-serif] font-bold leading-tight md:leading-[30px] lg:leading-[36.029px] relative shrink-0 text-[#93adae] text-[24px] md:text-[30px] lg:text-[36.696px] tracking-[-1px] md:tracking-[-1.2px] lg:tracking-[-1.3344px]">
              {communityData?.name || 'Willer Universe'}
            </p>
          </div>
        </div>
      </div>
      <div id="grid-container" className="h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] lg:h-[calc(100vh-120px)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <FeedSkeletons />
          </div>
        ) : (
          <div className="flex gap-4 md:gap-5 lg:gap-7 px-4 md:px-6 lg:px-8 h-full">
            {/* Split posts into three columns */}
            {[0, 1, 2].map(colIndex => (
              <div key={colIndex} className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="space-y-4 md:space-y-5 lg:space-y-7 py-4 md:py-6 lg:py-8 px-2">
                  {posts
                    .filter((_, index) => index % 3 === colIndex)
                    .map(renderPost)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
