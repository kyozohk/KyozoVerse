'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThumbsUp, MessageSquare, Share2, Filter } from 'lucide-react';
import { FeedSkeletons } from '@/components/community/feed/skeletons';
import { getUserRoleInCommunity, getCommunityByHandle } from '@/lib/community-utils';
import { type Post, type User } from '@/lib/types';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreatePostButtons, PostType } from '@/components/community/feed/create-post-buttons';
import { CreatePostDialog } from '@/components/community/feed/create-post-dialog';
import { TextPostCard } from '@/components/community/feed/text-post-card';
import { AudioPostCard } from '@/components/community/feed/audio-post-card';
import { VideoPostCard } from '@/components/community/feed/video-post-card';

export default function CommunityFeedPage() {
  const { user } = useAuth();
  const params = useParams();
  const handle = params.handle as string;

  const [posts, setPosts] = useState<(Post & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('guest');
  const [communityId, setCommunityId] = useState<string>('');
  const [communityData, setCommunityData] = useState<any>(null);
  const [filter, setFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all');
  const [isCreatePostOpen, setCreatePostOpen] = useState(false);
  const [postType, setPostType] = useState<PostType | null>(null);

  useEffect(() => {
    async function fetchCommunityAndRole() {
      if (!handle) return;

      try {
        const communityData = await getCommunityByHandle(handle);

        if (communityData) {
          setCommunityId(communityData.communityId);
          setCommunityData(communityData);

          if (user) {
            const role = await getUserRoleInCommunity(user.uid, communityData.communityId);
            setUserRole(role);
          }
        }
      } catch (error) {
        console.error('Error fetching community data:', error);
      }
    }

    fetchCommunityAndRole();
  }, [handle, user]);

  useEffect(() => {
    if (!handle || !communityId) {
      return;
    }

    const postsCollection = collection(db, 'blogs');

    const constraints = [];
    constraints.push(where('communityHandle', '==', handle));

    // Only show public posts to non-logged in users
    if (!user) {
      constraints.push(where('visibility', '==', 'public'));
    }
    // For logged in users, we'll filter by visibility later in the code
    // This allows us to fetch all posts and then filter them client-side

    constraints.push(orderBy('createdAt', 'desc'));

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

      // Filter posts based on visibility and user role
      let visiblePosts = postsData;
      
      // If user is not logged in, only show public posts
      if (!user) {
        visiblePosts = postsData.filter((p) => p.visibility === 'public');
      } 
      // If user is logged in but not an admin/owner, show public posts and their own private posts
      else if (userRole !== 'admin' && userRole !== 'owner') {
        visiblePosts = postsData.filter((p) => 
          p.visibility === 'public' || (p.visibility === 'private' && p.authorId === user.uid)
        );
      }
      // Admins and owners can see all posts
      
      setPosts(visiblePosts);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching posts:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [handle, user, communityId]);

  const handleSelectPostType = (type: PostType) => {
    setPostType(type);
    setCreatePostOpen(true);
  };

  const filteredPosts = posts.filter((post) => {
    // Filter by content type
    const typeMatch = 
      filter === 'all' ? true :
      filter === 'images' ? post.type === 'image' :
      filter === 'text' ? post.type === 'text' :
      filter === 'audio' ? post.type === 'audio' :
      filter === 'video' ? post.type === 'video' : true;
    
    // Filter by visibility
    const visibilityMatch = 
      visibilityFilter === 'all' ? true :
      visibilityFilter === 'public' ? post.visibility === 'public' :
      visibilityFilter === 'private' ? post.visibility === 'private' : true;
    
    return typeMatch && visibilityMatch;
  });

  // Only admins and owners can create/edit content
  const canEditContent = userRole === 'admin' || userRole === 'owner';
  
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
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Author Dashboard</p>
              <Link href={`/c/${handle}`} className="text-xs text-primary hover:underline">
                View Public Feed
              </Link>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-2">
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
            
            {user && (
              <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Posts</SelectItem>
                  <SelectItem value="public">Public Only</SelectItem>
                  <SelectItem value="private">Private Only</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
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
            switch (post.type) {
              case 'text':
              case 'image':
                return <TextPostCard key={post.id} post={post} />;
              case 'audio':
                return <AudioPostCard key={post.id} post={post} />;
              case 'video':
                return <VideoPostCard key={post.id} post={post} />;
              default:
                return null;
            }
          })
        )}
      </div>
      {canEditContent && (
        <CreatePostButtons onSelectPostType={handleSelectPostType} />
      )}
       <CreatePostDialog 
        isOpen={isCreatePostOpen} 
        setIsOpen={setCreatePostOpen} 
        postType={postType} 
        communityId={communityId}
        communityHandle={handle} />
    </div>
  );
}
