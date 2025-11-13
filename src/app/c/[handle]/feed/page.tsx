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

    const constraints = [
      where('communityHandle', '==', handle),
      where('visibility', '==', 'public'), // Only show public posts
      orderBy('createdAt', 'desc')
    ];

    const q = query(postsCollection, ...constraints);

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

  const filteredPosts = posts.filter((post) => {
    // Filter by content type
    return filter === 'all' ? true :
      filter === 'images' ? post.type === 'image' :
      filter === 'text' ? post.type === 'text' :
      filter === 'audio' ? post.type === 'audio' :
      filter === 'video' ? post.type === 'video' : true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Community Header Section */}
      <div className="container mx-auto max-w-4xl px-4 pt-8 pb-4">
        <div className="overflow-hidden rounded-lg p-8 bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-full overflow-hidden w-16 h-16 bg-white/10 border-2 border-primary">
                <Image 
                  src={communityData?.communityProfileImage || '/logo.png'} 
                  alt={communityData?.name || handle} 
                  width={64} 
                  height={64} 
                  className="object-cover"
                />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-slate-800">@{handle}</h2>
                {communityData?.description ? (
                  <p className="text-slate-600">{communityData.description}</p>
                ) : (
                  <p className="text-slate-600 italic opacity-70">Community feed</p>
                )}
              </div>
            </div>
            
            <Link 
              href="/" 
              className="text-sm text-white/70 hover:text-white bg-primary/80 px-4 py-2 rounded-full"
            >
              Join Community
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Community Feed</h2>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Content Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="images">Images</SelectItem>
                <SelectItem value="text">Text Only</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="video">Video</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-6">
          {loading ? (
            <FeedSkeletons />
          ) : filteredPosts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <h2 className="text-xl font-semibold">No posts to display</h2>
                <p className="text-muted-foreground mt-2">
                  {filter !== 'all'
                    ? `There are no ${filter} posts in this community yet.`
                    : 'There are no posts in this community yet.'}
                </p>
              </CardContent>
            </Card>
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
      <footer className="bg-white border-t py-6 mt-12">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} KyozoVerse
            </p>
            <div className="flex gap-4">
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
                Terms
              </Link>
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
