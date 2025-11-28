
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { FeedSkeletons } from '@/components/community/feed/skeletons';
import { getUserRoleInCommunity, getCommunityByHandle } from '@/lib/community-utils';
import { type Post, type User } from '@/lib/types';
import { CreatePostButtons, PostType } from '@/components/community/feed/create-post-buttons';
import { CreatePostDialog } from '@/components/community/feed/create-post-dialog';
import { TextPostCard } from '@/components/community/feed/text-post-card';
import { AudioPostCard } from '@/components/community/feed/audio-post-card';
import { VideoPostCard } from '@/components/community/feed/video-post-card';
import { ListView } from '@/components/ui/list-view';

export default function CommunityFeedPage() {
  const { user } = useAuth();
  const params = useParams();
  const handle = params.handle as string;

  const [posts, setPosts] = useState<(Post & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('guest');
  const [communityId, setCommunityId] = useState<string>('');
  const [isCreatePostOpen, setCreatePostOpen] = useState(false);
  const [postType, setPostType] = useState<PostType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    async function fetchCommunityAndRole() {
      if (!handle) return;

      try {
        const communityData = await getCommunityByHandle(handle);

        if (communityData) {
          setCommunityId(communityData.communityId);

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
    const constraints = [where('communityHandle', '==', handle)];
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
      
      // Sort posts by createdAt in memory
      postsData.sort((a, b) => {
        const aTime = a.createdAt?.getTime() || 0;
        const bTime = b.createdAt?.getTime() || 0;
        return bTime - aTime;
      });

      let visiblePosts = postsData;
      if (!user) {
        visiblePosts = postsData.filter((p) => p.visibility === 'public');
      } 
      else if (userRole !== 'admin' && userRole !== 'owner') {
        visiblePosts = postsData.filter((p) => 
          p.visibility === 'public' || (p.visibility === 'private' && p.authorId === user.uid)
        );
      }
      
      setPosts(visiblePosts);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching posts:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [handle, user, communityId, userRole]);

  const handleSelectPostType = (type: PostType) => {
    setPostType(type);
    setCreatePostOpen(true);
  };

  const filteredPosts = posts.filter(post =>
    post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content.text?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canEditContent = userRole === 'admin' || userRole === 'owner';
  
  return (
    <>
      <ListView
        title="Feed"
        subtitle="Latest posts from the community."
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        loading={loading}
        headerAction={
          <a
            href={`/c/${handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Public View
          </a>
        }
      >
        {filteredPosts.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <h2 className="text-xl font-semibold">No posts to display</h2>
              <p className="mt-2">
                There are no posts in this community yet that match your search.
              </p>
            </div>
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
      </ListView>
      {canEditContent && (
        <CreatePostButtons onSelectPostType={handleSelectPostType} />
      )}
       <CreatePostDialog 
        isOpen={isCreatePostOpen} 
        setIsOpen={setCreatePostOpen} 
        postType={postType} 
        communityId={communityId}
        communityHandle={handle} />
    </>
  );
}
