'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc, setDoc } from 'firebase/firestore';
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

  const [posts, setPosts] = useState<(Post & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [communityData, setCommunityData] = useState<any>(null);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);

  // Fetch community data and handle membership
  useEffect(() => {
    async function fetchCommunityData() {
      if (!handle) return;
      try {
        const data = await getCommunityByHandle(handle);
        if (data) {
          setCommunityData(data);
          // If a user is logged in, add them to the community members
          if (communityUser?.email && data.communityId) {
            const memberRef = doc(db, 'communities', data.communityId, 'members', communityUser.uid);
            getDoc(memberRef).then(docSnap => {
              if (!docSnap.exists()) {
                setDoc(memberRef, { 
                  email: communityUser.email,
                  uid: communityUser.uid,
                  joinedAt: new Date(),
                });
              }
            });
          }
        }
      } catch (error) {
        console.error('Error fetching community data:', error);
      }
    }
    fetchCommunityData();
  }, [handle, communityUser]);

  // Fetch posts
  useEffect(() => {
    if (!handle) return;
    const postsCollection = collection(db, 'blogs');
    const q = query(
      postsCollection,
      where('communityHandle', '==', handle)
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
          } catch (error) {}
        }
        postsData.push({
          id: postDoc.id,
          ...postData,
          author: authorData || { userId: 'unknown', displayName: 'Unknown User' },
          createdAt: postData.createdAt?.toDate(),
        });
      }
      // Sort posts by createdAt in memory
      postsData.sort((a, b) => {
        const aTime = a.createdAt?.getTime() || 0;
        const bTime = b.createdAt?.getTime() || 0;
        return bTime - aTime;
      });
      console.log('[Public Feed] Fetched posts:', postsData.length, postsData);
      console.log('[Public Feed] Post visibility values:', postsData.map(p => ({ id: p.id, visibility: p.visibility })));
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching posts:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [handle]);

  // Temporarily show all posts for debugging - TODO: filter by visibility once posts have correct visibility field
  const publicPosts = posts; // posts.filter(p => p.visibility === 'public');
  const privatePosts: typeof posts = []; // posts.filter(p => p.visibility !== 'public');
  
  console.log('[Public Feed] Total posts:', posts.length, 'Public:', publicPosts.length, 'Private:', privatePosts.length);

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
      <JoinCommunityDialog 
        open={isJoinDialogOpen} 
        onOpenChange={setIsJoinDialogOpen}
        communityId={communityData?.communityId || ''}
        communityName={communityData?.name || handle}
      />
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

        <main className="container mx-auto max-w-7xl px-4 py-8">
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
              {/* Bento Box Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">
                {publicPosts.map((post, index) => {
                  // Determine card size based on index for bento box effect
                  const isLarge = index % 5 === 0;
                  const isMedium = index % 3 === 0 && !isLarge;
                  const spanClass = isLarge 
                    ? 'md:col-span-2 md:row-span-2' 
                    : isMedium 
                    ? 'md:col-span-1 md:row-span-2'
                    : 'md:col-span-1 md:row-span-1';
                  
                  return (
                    <div key={post.id} className={spanClass}>
                      {renderPost(post)}
                    </div>
                  );
                })}
              </div>

              {communityUser ? (
                privatePosts.length > 0 && (
                  <div className="mt-8">
                    <h2 className="text-2xl font-bold text-white mb-4">Members Only Content</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">
                      {privatePosts.map((post, index) => {
                        const isLarge = index % 5 === 0;
                        const isMedium = index % 3 === 0 && !isLarge;
                        const spanClass = isLarge 
                          ? 'md:col-span-2 md:row-span-2' 
                          : isMedium 
                          ? 'md:col-span-1 md:row-span-2'
                          : 'md:col-span-1 md:row-span-1';
                        
                        return (
                          <div key={post.id} className={spanClass}>
                            {renderPost(post)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
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
    </>
  );
}
