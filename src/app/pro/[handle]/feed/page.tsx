

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

        if (communityData && user) {
          const role = await getUserRoleInCommunity(user.uid, communityData.communityId);
          setUserRole(role);
        }
      } catch (error) {
        console.error('Error fetching community data:', error);
      }
    }

    fetchCommunityAndRole();
  }, [handle, user]);

  useEffect(() => {
    if (!community?.communityId) {
      setLoading(false);
      return;
    }

    const postsCollection = collection(db, 'blogs');
    
    const postsQuery = query(
      postsCollection,
      where('communityHandle', '==', handle),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(postsQuery, async (querySnapshot) => {
      const postsData = await Promise.all(querySnapshot.docs.map(async (postDoc) => {
        const data = postDoc.data() as Post;
        let authorDetails: User | null = null;
        if (data.authorId) {
          try {
            const userRef = doc(db, 'users', data.authorId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              authorDetails = userSnap.data() as User;
            }
          } catch (e) {
            console.warn(`Could not fetch author for post ${postDoc.id}:`, e);
          }
        }
        return {
          id: postDoc.id,
          ...data,
          author: authorDetails || { userId: 'unknown', displayName: 'Unknown User' },
        } as Post & { id: string };
      }));
      
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error('❌ Firestore query error in /pro feed:', error);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `blogs`,
        operation: 'list',
      }));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [community?.communityId, handle]);

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
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    
    if (['text', 'audio', 'video'].includes(searchLower)) {
      return post.type?.toLowerCase() === searchLower || 
             (searchLower === 'text' && post.type === 'image');
    }
    
    return post.title?.toLowerCase().includes(searchLower) ||
           post.content?.text?.toLowerCase().includes(searchLower);
  });

  const canManageContent = userRole === 'admin' || userRole === 'owner';
  
  const buttonConfig = [
    { type: 'text' as PostType, icon: Pencil, color: '#C170CF', label: 'Text' },
    { type: 'audio' as PostType, icon: Mic, color: '#699FE5', label: 'Audio' },
    { type: 'video' as PostType, icon: Video, color: '#CF7770', label: 'Video' },
  ];

  const renderPost = (post: Post & { id: string }) => {
    const commonProps = {
      key: post.id,
      post: {
        ...post,
        _canEdit: canManageContent,
        _onEdit: () => handleEditPost(post),
      }
    };

    switch (post.type) {
      case 'text':
      case 'image':
        return <div onClick={() => setSelectedPost(post)} className="cursor-pointer break-inside-avoid mb-6"><ReadCard {...commonProps} category={post.type === 'image' ? 'Image' : 'Text'} readTime="5 min read" title={post.title || ''} summary={post.content.text} /></div>;
      case 'audio':
        return <div onClick={() => setSelectedPost(post)} className="cursor-pointer break-inside-avoid mb-6"><ListenCard {...commonProps} category="Audio" episode="Listen" duration="0:00" title={post.title || ''} summary={post.content.text} /></div>;
      case 'video':
        return <div onClick={() => setSelectedPost(post)} className="cursor-pointer break-inside-avoid mb-6"><WatchCard {...commonProps} category="Video" title={post.title || ''} imageUrl={post.content.mediaUrls?.[0] || ''} imageHint="video" /></div>;
      default:
        return null;
    }
  };
  
  return (
    <>
      <div className="p-6">
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
          
          <div className="flex items-center gap-2">
            {['', 'text', 'audio', 'video'].map(filter => (
                <button
                key={filter || 'all'}
                onClick={() => setSearchTerm(filter)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border-2 ${
                    searchTerm === filter
                    ? 'bg-gray-700 text-white border-gray-700'
                    : 'bg-transparent text-gray-600 hover:bg-gray-100 border-gray-300'
                }`}
                >
                {filter === '' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
            ))}
          </div>
        </div>
        
        <FeedStats posts={posts} />

        {canManageContent && (
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

        {loading ? (
          <div className="masonry-feed-columns"><FeedSkeletons /></div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <h2 className="text-xl font-semibold">No posts to display</h2>
            <p className="mt-2">
              Create a new post or adjust your filters.
            </p>
          </div>
        ) : (
          <div className="masonry-feed-columns">
            {filteredPosts.map(renderPost)}
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
      
      <PostDetailPanel
        post={selectedPost}
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
      />
    </>
  );
}
