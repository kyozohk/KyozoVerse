
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { FeedSkeletons } from '@/components/community/feed/skeletons';
import { getCommunityByHandle } from '@/lib/community-utils';
import { type Post, type User } from '@/lib/types';
import { TextPostCard } from '@/components/community/feed/text-post-card';
import { AudioPostCard } from '@/components/community/feed/audio-post-card';
import { VideoPostCard } from '@/components/community/feed/video-post-card';
import Link from 'next/link';
import Image from 'next/image';
import { useCommunityAuth } from '@/hooks/use-community-auth';
import { Button } from '@/components/ui/button';
import { JoinCommunityDialog } from '@/components/community/join-community-dialog';

export default function PublicFeedPage() {
  const params = useParams();
  const handle = params.handle as string;

  const { user: communityUser, loading: communityAuthLoading } = useCommunityAuth();
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);

  const [posts, setPosts] = useState<(Post & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [communityData, setCommunityData] = useState<any>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchCommunityData() {
      if (!handle) return;

      try {
        const data = await getCommunityByHandle(handle);
        if (data) {
          setCommunityData(data);
        }
      } catch (error) {
        console.error('Error fetching community data:', error);
      }
    }

    fetchCommunityData();
  }, [handle]);

  useEffect(() => {
    if (!handle) {
      return;
    }

    const postsCollection = collection(db, 'blogs');

    const q = query(
      postsCollection,
      where('communityHandle', '==', handle),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const postsData: (Post & { id: string })[] = [];

      for (const postDoc of querySnapshot.docs) {
        const postData = postDoc.data() as Post;
        let authorData: User | null = null;
        if (postData.authorId) {
          try {
            const userRef = doc(db, 'users', postData.authorId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              authorData = userSnap.data() as User;
            }
          } catch (error) {
            // If we can't fetch author, proceed without it
          }
        }

        postsData.push({
          id: postDoc.id,
          ...postData,
          author: authorData || { userId: 'unknown', displayName: 'Unknown User' },
          createdAt: postData.createdAt?.toDate(),
        });
      }
      
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching posts:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [handle]);

  const publicPosts = posts.filter(p => p.visibility === 'public');
  const privatePosts = posts.filter(p => p.visibility !== 'public');

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
  }

  return (
    <>
    <div className="min-h-screen">
      <div className="container mx-auto max-w-4xl px-4 pt-16 pb-8">
        <div className="overflow-hidden rounded-lg p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-full overflow-hidden w-16 h-16 bg-white/10 border-2 border-white">
                <Image 
                  src={communityData?.communityProfileImage || '/logo.png'} 
                  alt={communityData?.name || handle} 
                  width={64} 
                  height={64} 
                  className="object-cover"
                />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-[#4D5F71]">@{handle}</h2>
                {communityData?.description ? (
                  <p className="text-[#4D5F71]">{communityData.description}</p>
                ) : (
                  <p className="text-[#4D5F71] italic opacity-70">Community feed</p>
                )}
              </div>
            </div>
          </div>
          
          {communityData?.name && (
            <div className="mt-10 mb-8 overflow-visible">
              <h1 className="text-5xl md:text-7xl font-bold" style={{ 
                background: 'linear-gradient(to top right, #596086, #B2778C)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block',
                paddingBottom: '0.2em',
                lineHeight: '1.3'
              }}>{communityData.name}</h1>
            </div>
          )}
        </div>
      </div>

      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-6">
          {loading || communityAuthLoading ? (
            <FeedSkeletons />
          ) : posts.length === 0 ? (
            <div className="rounded-lg bg-black/20 backdrop-blur-sm overflow-hidden">
              <div className="text-center py-16 px-4">
                <h2 className="text-2xl font-bold text-white mb-4">No posts to display</h2>
                <p className="text-white/70 max-w-md mx-auto">
                  There are no posts in this community yet.
                </p>
              </div>
            </div>
          ) : (
            <>
              {publicPosts.map(renderPost)}

              {communityUser ? (
                privatePosts.map(renderPost)
              ) : privatePosts.length > 0 ? (
                <div className="relative rounded-lg border-2 border-dashed border-gray-600 p-8 text-center my-8">
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
                  <div className="relative">
                    <h3 className="text-2xl font-bold text-white mb-4">You are missing out!</h3>
                    <p className="text-white/80 mb-6">
                      Join the {communityData?.name || handle} community to view all private posts and engage with the creator.
                    </p>
                    <Button onClick={() => setIsJoinDialogOpen(true)} size="lg">
                      Join to View All Content
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </main>

      <footer className="bg-black/30 backdrop-blur-sm border-t border-gray-800 py-6 mt-12">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-white/60">
              © {new Date().getFullYear()} KyozoVerse
            </p>
            <div className="flex gap-6">
              <span className="text-sm text-white/60 hover:text-white cursor-pointer">
                Terms
              </span>
              <span className="text-sm text-white/60 hover:text-white cursor-pointer">
                Privacy
              </span>
              <span className="text-sm text-white/60 hover:text-white cursor-pointer">
                Contact
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
    {communityData && (
      <JoinCommunityDialog 
        open={isJoinDialogOpen} 
        onOpenChange={setIsJoinDialogOpen}
        communityId={communityData.communityId}
        communityName={communityData.name}
      />
    )}
    </>
  );
}
