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
import Image from 'next/image';
import Link from 'next/link';

export default function FeedViewPage() {
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
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <div className="flex justify-between items-center mb-6">
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
            <h1 className="text-2xl font-bold">{communityData?.name || handle}</h1>
            <p className="text-sm text-muted-foreground">Community Feed</p>
          </div>
        </div>

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
            // Mark all posts as public view
            const publicPost = {
              ...post,
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
      
      {/* Link to author view if needed */}
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          Are you the community owner? <Link href={`/pro/${handle}/feed`} className="text-primary hover:underline">Sign in to manage content</Link>
        </p>
      </div>
    </div>
  );
}
