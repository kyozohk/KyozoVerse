
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { FeedSkeletons } from '@/components/community/feed/skeletons';
import { getCommunityByHandle } from '@/lib/community-utils';
import { type Post, type User, type Community } from '@/lib/types';
import { TextPostCard } from '@/components/community/feed/text-post-card';
import { AudioPostCard } from '@/components/community/feed/audio-post-card';
import { VideoPostCard } from '@/components/community/feed/video-post-card';
import Image from 'next/image';
import Link from 'next/link';
import { CustomButton } from '@/components/ui';
import { useCommunityAuth } from '@/hooks/use-community-auth';
import { useRouter } from 'next/navigation';

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
    if (!handle || !communityData) return;

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
  }, [handle, communityData]);

  const handleSignOut = async () => {
    await signOut();
  };

  const renderPost = (post: Post & { id: string }) => {
    const postProps = { ...post, _isPublicView: true };
    switch (post.type) {
      case 'text':
      case 'image':
        return <TextPostCard key={post.id} post={postProps} />;
      case 'audio':
        return <AudioPostCard key={post.id} post={postProps} />;
      case 'video':
        return <VideoPostCard key={post.id} post={postProps} />;
      default:
        return null;
    }
  };
  
  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/bg/feed_bg.png)' }}
    >
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/30 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto max-w-4xl px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {communityData?.communityProfileImage && (
              <Image 
                src={communityData.communityProfileImage} 
                alt={communityData.name || handle} 
                width={40} 
                height={40} 
                className="rounded-full"
              />
            )}
            <div>
              <h1 className="text-xl font-bold text-white">{communityData?.name || handle}</h1>
              <p className="text-sm text-gray-300">{posts.length} posts</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {communityUser ? (
              <>
                <span className="text-white text-sm hidden sm:inline">
                  {communityUser.displayName || communityUser.email}
                </span>
                <CustomButton onClick={handleSignOut} variant="outline" className="text-white border-white">
                  Sign Out
                </CustomButton>
              </>
            ) : (
              <Link href={`/c/${handle}/signup`}>
                <CustomButton className="bg-purple-600 hover:bg-purple-700 text-white">
                  Join Community
                </CustomButton>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Feed Content */}
      <main className="container mx-auto max-w-4xl px-4 py-8">
        {loading ? (
          <FeedSkeletons />
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white text-lg">No posts yet</p>
            <p className="text-gray-400 mt-2">Check back later for updates</p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
            {posts.map(renderPost)}
          </div>
        )}
      </main>
    </div>
  );
}
