
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { FeedSkeletons } from '@/components/community/feed/skeletons';
import { getUserRoleInCommunity, getCommunityByHandle } from '@/lib/community-utils';
import { type Post, type User } from '@/lib/types';
import { PostType } from '@/components/community/feed/create-post-buttons';
import { CreatePostDialog } from '@/components/community/feed/create-post-dialog';
import { Pencil, Mic, Video } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { ReadCard } from '@/components/content-cards/read-card';
import { ListenCard } from '@/components/content-cards/listen-card';
import { WatchCard } from '@/components/content-cards/watch-card';
import Link from 'next/link';

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
  const [editingPost, setEditingPost] = useState<(Post & { id: string }) | null>(null);

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
      if (handle) setLoading(false); // If handle exists but no communityId yet, stop loading to show empty state
      return;
    }

    const postsCollection = collection(db, 'blogs');
    
    const postsQuery = query(
      postsCollection,
      where('communityHandle', '==', handle),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(postsQuery, async (querySnapshot) => {
      const allPostsData = await Promise.all(querySnapshot.docs.map(async (postDoc) => {
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
            console.warn(`Could not fetch author for post ${postDoc.id}:`, error);
          }
        }

        return {
          id: postDoc.id,
          ...postData,
          author: authorData || { userId: 'unknown', displayName: 'Unknown User' },
          createdAt: postData.createdAt?.toDate(),
        } as Post & { id: string };
      }));

      // Client-side filtering based on user role
      let visiblePosts: (Post & { id: string })[] = [];
      if (user) {
        if (userRole === 'admin' || userRole === 'owner') {
          visiblePosts = allPostsData; // Admins/owners see all posts
        } else {
          visiblePosts = allPostsData.filter(p => 
            p.visibility === 'public' || p.authorId === user.uid
          );
        }
      } else {
        // This case shouldn't be reached in /pro routes, but as a fallback
        visiblePosts = allPostsData.filter(p => p.visibility === 'public');
      }

      setPosts(visiblePosts);
      setLoading(false);
    }, (error) => {
      const permissionError = new FirestorePermissionError({
        path: postsQuery.path,
        operation: 'list'
      });
      errorEmitter.emit('permission-error', permissionError);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [handle, user, communityId, userRole]);

  const handleSelectPostType = (type: PostType) => {
    setPostType(type);
    setEditingPost(null);
    setCreatePostOpen(true);
  };

  const handleEditPost = (post: Post & { id: string }) => {
    setEditingPost(post);
    setPostType(post.type as PostType);
    setCreatePostOpen(true);
  };

  const filteredPosts = posts.filter(post =>
    post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content.text?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canEditContent = userRole === 'admin' || userRole === 'owner';
  
  const buttonConfig = [
    { type: 'text' as PostType, icon: Pencil, color: '#C170CF', label: 'Text' },
    { type: 'audio' as PostType, icon: Mic, color: '#699FE5', label: 'Audio' },
    { type: 'video' as PostType, icon: Video, color: '#CF7770', label: 'Video' },
  ];

  const renderPost = (post: Post & { id: string }) => {
    const readTime = post.content?.text ? `${Math.max(1, Math.ceil((post.content.text.length || 0) / 1000))} min read` : '1 min read';
    const postDate = post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Dec 2024';

    const cardProps = {
      key: post.id,
      onClick: () => handleEditPost(post),
      className: "cursor-pointer"
    };

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
    <>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Feed</h1>
            <p className="text-sm text-muted-foreground">Latest posts from the community.</p>
          </div>
          <a
            href={`/${handle}`}
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
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Create Post Buttons */}
        {canEditContent && (
          <div className="mb-6 flex gap-3 w-full">
            {buttonConfig.map((config) => (
              <button
                key={config.type}
                className="rounded h-10 flex items-center justify-center cursor-pointer border-0 outline-none hover:opacity-80 transition-opacity flex-1"
                style={{
                  backgroundColor: `${config.color}90`,
                  color: 'white',
                  border: `1px solid ${config.color}`,
                }}
                onClick={() => handleSelectPostType(config.type)}
                title={`Post ${config.label}`}
              >
                <config.icon className="w-4 h-4 mr-2" />
                {config.label}
              </button>
            ))}
          </div>
        )}

        {/* Masonry Grid Layout */}
        {loading ? (
          <FeedSkeletons />
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <h2 className="text-xl font-semibold">No posts to display</h2>
            <p className="mt-2">
              There are no posts in this community yet that match your search.
            </p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
            {filteredPosts.map((post) => (
              <div key={post.id} className="break-inside-avoid mb-4 cursor-pointer" onClick={() => handleEditPost(post)}>
                {renderPost(post)}
              </div>
            ))}
          </div>
        )}
      </div>
      <CreatePostDialog 
        isOpen={isCreatePostOpen} 
        setIsOpen={setCreatePostOpen} 
        postType={postType} 
        communityId={communityId}
        communityHandle={handle}
        editPost={editingPost} />
    </>
  );
}
