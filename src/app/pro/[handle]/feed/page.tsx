
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { FeedSkeletons } from '@/components/community/feed/skeletons';
import { getUserRoleInCommunity, getCommunityByHandle } from '@/lib/community-utils';
import { type Post, type User, type Community } from '@/lib/types';
import { PostType } from '@/components/community/feed/create-post-buttons';
import { CreatePostDialog } from '@/components/community/feed/create-post-dialog';
import { Pencil, Mic, Video } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { ReadCard } from '@/components/content-cards/read-card';
import { ListenCard } from '@/components/content-cards/listen-card';
import { WatchCard } from '@/components/content-cards/watch-card';
import { PostDetailPanel } from '@/components/community/feed/post-detail-panel';
import { TextPostCard } from '@/components/community/feed/text-post-card';
import { AudioPostCard } from '@/components/community/feed/audio-post-card';
import { VideoPostCard } from '@/components/community/feed/video-post-card';
import Link from 'next/link';
import { FeedStats } from '@/components/community/feed-stats';

export default function CommunityFeedPage() {
  const { user } = useAuth();
  const params = useParams();
  const handle = params.handle as string;

  const [posts, setPosts] = useState<(Post & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [postType, setPostType] = useState<PostType>('text');
  const [editingPost, setEditingPost] = useState<(Post & { id: string }) | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [community, setCommunity] = useState<Community | null>(null);
  const [selectedPost, setSelectedPost] = useState<(Post & { id: string}) | null>(null);

  useEffect(() => {
    async function fetchCommunityAndRole() {
      if (!handle) return;

      try {
        const communityData = await getCommunityByHandle(handle);
        setCommunity(communityData);

        if (communityData) {
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
    if (!handle || !community?.communityId) {
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

      console.log('📊 All posts loaded from Firestore:', allPostsData.length);
      console.log('📝 Posts details:', allPostsData.map(p => ({
        id: p.id,
        title: p.title,
        type: p.type,
        visibility: p.visibility,
        authorId: p.authorId,
        mediaUrls: p.content?.mediaUrls,
        createdAt: p.createdAt
      })));

      // Client-side filtering based on user role
      let visiblePosts: (Post & { id: string })[] = [];
      if (user) {
        if (userRole === 'admin' || userRole === 'owner') {
          visiblePosts = allPostsData; // Admins/owners see all posts
          console.log('✅ User is admin/owner - showing all posts');
        } else {
          visiblePosts = allPostsData.filter(p => 
            p.visibility === 'public' || p.authorId === user.uid
          );
          console.log('👤 User is member - filtered posts:', visiblePosts.length);
        }
      } else {
        // This case shouldn't be reached in /pro routes, but as a fallback
        visiblePosts = allPostsData.filter(p => p.visibility === 'public');
        console.log('🌍 No user - showing public posts only');
      }

      console.log('🎯 Final visible posts:', visiblePosts.length, visiblePosts.map(p => ({
        id: p.id,
        title: p.title,
        type: p.type
      })));

      setPosts(visiblePosts);
      setLoading(false);
    }, (error) => {
      console.error('❌ Firestore query error in /pro feed:', {
        error,
        errorCode: error.code,
        errorMessage: error.message,
        user: user?.uid,
        userEmail: user?.email,
        handle,
        communityId,
        userRole
      });
      const permissionError = new FirestorePermissionError({
        path: 'blogs',
        operation: 'list'
      });
      errorEmitter.emit('permission-error', permissionError);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [handle, user, community?.communityId, userRole]);

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

  const filteredPosts = posts.filter(post => {
    // If no search term, show all posts
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Check if it's a filter button click (exact match with post type)
    if (searchLower === 'text' || searchLower === 'audio' || searchLower === 'video') {
      return post.type?.toLowerCase() === searchLower || 
             (searchLower === 'text' && post.type === 'image'); // Include images in text filter
    }
    
    // Otherwise, search in title, content, and type
    return (
      post.title?.toLowerCase().includes(searchLower) ||
      post.content?.text?.toLowerCase().includes(searchLower) ||
      post.type?.toLowerCase().includes(searchLower)
    );
  });

  console.log('🔍 Search term:', searchTerm);
  console.log('📋 Posts before filter:', posts.length);
  console.log('📋 Posts after filter:', filteredPosts.length);

  const canEditContent = userRole === 'admin' || userRole === 'owner';
  
  const buttonConfig = [
    { type: 'text' as PostType, icon: Pencil, color: '#C170CF', label: 'Text' },
    { type: 'audio' as PostType, icon: Mic, color: '#699FE5', label: 'Audio' },
    { type: 'video' as PostType, icon: Video, color: '#CF7770', label: 'Video' },
  ];

  const renderPost = (post: Post & { id: string }) => {
    console.log('🎨 Rendering post:', {
      id: post.id,
      type: post.type,
      title: post.title,
      hasMediaUrls: !!post.content?.mediaUrls,
      mediaUrl: post.content?.mediaUrls?.[0]
    });

    const readTime = post.content?.text ? `${Math.max(1, Math.ceil((post.content.text.length || 0) / 1000))} min read` : '1 min read';
    const postDate = post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Dec 2024';

    switch (post.type) {
      case 'text':
      case 'image':
        return (
          <div key={post.id} onClick={() => setSelectedPost(post)} className="cursor-pointer">
            <ReadCard
              category={post.type === 'image' ? 'Image' : 'Text'}
              readTime={readTime}
              date={postDate}
              title={post.title || 'Untitled'}
              summary={post.content.text}
              isPrivate={post.visibility === 'private'}
            />
          </div>
        );
      case 'audio':
        return (
          <div key={post.id} onClick={() => setSelectedPost(post)} className="cursor-pointer">
            <ListenCard
              category="Audio"
              episode="Listen"
              duration="0:00"
              title={post.title || 'Untitled Audio'}
              summary={post.content.text}
              isPrivate={post.visibility === 'private'}
            />
          </div>
        );
      case 'video':
        return (
          <div key={post.id} onClick={() => setSelectedPost(post)} className="cursor-pointer">
            <WatchCard
              category="Video"
              title={post.title || 'Untitled Video'}
              imageUrl={post.content.mediaUrls?.[0] || 'https://picsum.photos/seed/video-placeholder/800/600'}
              imageHint="video content"
              isPrivate={post.visibility === 'private'}
            />
          </div>
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
          
          {/* Filter buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchTerm('')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                searchTerm === ''
                  ? 'bg-gray-700 text-white'
                  : 'bg-transparent text-gray-600 hover:bg-gray-100 border-gray-500 border-2'
              }`}
            >
              Feed
            </button>
            <button
              onClick={() => setSearchTerm('text')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                searchTerm === 'text'
                  ? 'bg-pink-100 text-pink-600 border-pink-500 border-2'
                  : 'bg-transparent text-gray-600 hover:bg-gray-100 border-pink-500 border-2'
              }`}
            >
              Read
            </button>
            <button
              onClick={() => setSearchTerm('audio')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                searchTerm === 'audio'
                  ? 'bg-blue-100 text-blue-600 border-blue-500 border-2'
                  : 'bg-transparent text-gray-600 hover:bg-gray-100 border-blue-500 border-2'
              }`}
            >
              Listen
            </button>
            <button
              onClick={() => setSearchTerm('video')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                searchTerm === 'video'
                  ? 'bg-yellow-100 text-yellow-600 border-yellow-500 border-2'
                  : 'bg-transparent text-gray-600 hover:bg-gray-100 border-yellow-500 border-2'
              }`}
            >
              Watch
            </button>
          </div>
        </div>
        
        {/* Feed Analytics */}
        <FeedStats posts={posts} />

        {/* Search Bar */}
        {/* <div className="mb-6">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div> */}

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
          <div id="grid-container" className="h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] lg:h-[calc(100vh-120px)] overflow-hidden">
            <div className="flex gap-4 md:gap-5 lg:gap-7 px-4 md:px-6 lg:px-8 h-full">
              {[0, 1, 2].map(colIndex => (
                <div key={colIndex} className="flex-1 overflow-y-auto scrollbar-hide">
                  <div className="space-y-4 md:space-y-5 lg:space-y-7 py-4 md:py-6 lg:py-8 px-2">
                    {filteredPosts
                      .filter((_, index) => index % 3 === colIndex)
                      .map(renderPost)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <CreatePostDialog 
        isOpen={createPostOpen} 
        setIsOpen={setCreatePostOpen} 
        postType={postType} 
        communityId={community?.communityId || ''}
        communityHandle={handle}
        editPost={editingPost} />
      
      {/* Post Detail Panel */}
      <PostDetailPanel
        post={selectedPost}
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
      />
    </>
  );
}
