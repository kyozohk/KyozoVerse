
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Filter } from 'lucide-react';
import { FeedSkeletons } from '@/components/community/feed/skeletons';
import { getCommunityByHandle } from '@/lib/community-utils';
import { type Post, type User } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TextPostCard } from '@/components/community/feed/text-post-card';
import { AudioPostCard } from '@/components/community/feed/audio-post-card';
import { VideoPostCard } from '@/components/community/feed/video-post-card';
import Link from 'next/link';
import Image from 'next/image';

export default function PublicFeedPage() {
  const params = useParams();
  const handle = params.handle as string;

  const [posts, setPosts] = useState<(Post & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [communityData, setCommunityData] = useState<any>(null);
  const [filter, setFilter] = useState<string>('all');

  // Fetch community data
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

  // Fetch posts
  useEffect(() => {
    if (!handle) {
      return;
    }

    const postsCollection = collection(db, 'blogs');

    // First query for community handle
    const q = query(
      postsCollection,
      where('communityHandle', '==', handle),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const postsData: (Post & { id: string })[] = [];

      for (const postDoc of querySnapshot.docs) {
        const postData = postDoc.data() as Post;
        
        // Only include public posts in the public view
        if (postData.visibility === 'public') {
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
      }
      
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching posts:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [handle]);

  const filteredPosts = posts.filter((post) => {
    // Filter by content type
    return filter === 'all' ? true :
      filter === 'images' ? post.type === 'image' :
      filter === 'text' ? post.type === 'text' :
      filter === 'audio' ? post.type === 'audio' :
      filter === 'video' ? post.type === 'video' : true;
  });

  return (
    <div className="min-h-screen">
      {/* Community Header Section */}
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

      {/* Subscription Box */}
      <div className="container mx-auto max-w-4xl px-4 mb-12">
        <div className="relative overflow-hidden rounded-lg">
          <Image 
            src="/bg/subscribe_bg.png" 
            alt="Subscribe background" 
            width={1200} 
            height={200} 
            className="w-full h-auto"
            priority
          />
          <div className="absolute inset-0 p-8 flex flex-col justify-center">
            <h3 className="text-3xl font-bold text-[#f7df1e] mb-2">Join the {communityData?.name || handle} community</h3>
            <p className="text-gray-300 mb-6 max-w-2xl text-base">
              Get exclusive content, updates, and insights delivered straight to your inbox. 
              Join our community to receive the latest posts and updates.
            </p>
            <div className="flex max-w-md">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-grow bg-white/10 border border-white/20 rounded-full px-6 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button 
                type="button" 
                className="bg-purple-500 hover:bg-purple-600 text-white font-medium ml-2 px-8 py-3 rounded-full transition-colors"
                style={{ backgroundColor: '#c084fc' }}
              >
                SUBSCRIBE
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-6">
          {loading ? (
            <FeedSkeletons />
          ) : filteredPosts.length === 0 ? (
            <div className="rounded-lg bg-black/20 backdrop-blur-sm overflow-hidden">
              <div className="text-center py-16 px-4">
                <h2 className="text-2xl font-bold text-white mb-4">No posts to display</h2>
                <p className="text-white/70 max-w-md mx-auto">
                  {filter !== 'all'
                    ? `There are no ${filter} posts in this community yet.`
                    : 'There are no posts in this community yet.'}
                </p>
              </div>
            </div>
          ) : (
            filteredPosts.map((post) => {
              // Create a modified post object that disables edit/delete for public view
              const publicPost = {
                ...post,
                // This will be checked in the post card components
                _isPublicView: true
              };
              
              switch (post.type) {
                case 'text':
                case 'image':
                  return <TextPostCard key={post.id} post={publicPost} />;
                case 'audio':
                  return <AudioPostCard key={post.id} post={publicPost} />;
                case 'video':
                  return <VideoPostCard key={post.id} post={publicPost} />;
                default:
                  return null;
              }
            })
          )}
        </div>
      </main>

      {/* Simple footer */}
      <footer className="bg-black/30 backdrop-blur-sm border-t border-gray-800 py-6 mt-12">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-white/60">
              © {new Date().getFullYear()} KyozoVerse
            </p>
            <div className="flex gap-6">
              <Link href="/" className="text-sm text-white/60 hover:text-white">
                Terms
              </Link>
              <Link href="/" className="text-sm text-white/60 hover:text-white">
                Privacy
              </Link>
              <Link href="/" className="text-sm text-white/60 hover:text-white">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
