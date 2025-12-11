
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
import { TextPostCard } from '@/components/community/feed/text-post-card';
import { AudioPostCard } from '@/components/community/feed/audio-post-card';
import { VideoPostCard } from '@/components/community/feed/video-post-card';
import { ListView } from '@/components/ui/list-view';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
      return;
    }

    const postsCollection = collection(db, 'blogs');
    
    // Query public and private posts separately to work with security rules
    // Query by communityHandle since that's what posts have
    const publicQuery = query(
      postsCollection,
      where('communityHandle', '==', handle),
      where('visibility', '==', 'public'),
      orderBy('createdAt', 'desc')
    );

    const privateQuery = query(
      postsCollection,
      where('communityHandle', '==', handle),
      where('visibility', '==', 'private'),
      orderBy('createdAt', 'desc')
    );

    const allPosts = new Map<string, Post & { id: string }>();

    const processSnapshot = async (querySnapshot: any) => {
      console.log(`📥 Processing ${querySnapshot.docs.length} posts from Firestore`);
      
      for (const postDoc of querySnapshot.docs) {
        const postData = postDoc.data() as Post;

        console.log('📝 Post loaded:', {
          id: postDoc.id,
          title: postData.title,
          type: postData.type,
          visibility: postData.visibility,
          authorId: postData.authorId,
          communityId: postData.communityId,
          communityHandle: postData.communityHandle,
          createdAt: postData.createdAt
        });

        let authorData: User | null = null;
        if (postData.authorId) {
          try {
            const userRef = doc(db, 'users', postData.authorId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              authorData = userSnap.data() as User;
              console.log(`👤 Author for post ${postDoc.id}:`, authorData.displayName || authorData.email);
            }
          } catch (error) {
            console.warn(`⚠️ Could not fetch author for post ${postDoc.id}:`, error);
          }
        }

        allPosts.set(postDoc.id, {
          id: postDoc.id,
          ...postData,
          author: authorData || { userId: 'unknown', displayName: 'Unknown User' },
          createdAt: postData.createdAt?.toDate(),
        });
      }

      // Sort all posts by createdAt
      const sortedPosts = Array.from(allPosts.values()).sort((a, b) => {
        const aTime = a.createdAt?.getTime() || 0;
        const bTime = b.createdAt?.getTime() || 0;
        return bTime - aTime;
      });

      // Apply visibility filtering based on user role
      let visiblePosts = sortedPosts;
      if (!user) {
        visiblePosts = sortedPosts.filter((p) => p.visibility === 'public');
      } else if (userRole !== 'admin' && userRole !== 'owner') {
        visiblePosts = sortedPosts.filter((p) => 
          p.visibility === 'public' || (p.visibility === 'private' && p.authorId === user.uid)
        );
      }
      
      console.log(`✅ Final visible posts (${visiblePosts.length}):`, visiblePosts.map(p => ({
        id: p.id,
        title: p.title,
        type: p.type,
        visibility: p.visibility,
        author: p.author?.displayName || p.author?.email || 'Unknown'
      })));
      
      setPosts(visiblePosts);
      setLoading(false);
    };

    // Subscribe to public posts
    const unsubscribePublic = onSnapshot(publicQuery, processSnapshot, (error) => {
      console.error('Error fetching public posts:', error);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'blogs',
        operation: 'list',
      }));
      setLoading(false);
    });

    // Subscribe to private posts
    const unsubscribePrivate = onSnapshot(privateQuery, processSnapshot, (error) => {
      console.error('Error fetching private posts:', error);
      // Don't emit error for private posts as user might not have permission
    });

    return () => {
      unsubscribePublic();
      unsubscribePrivate();
    };
  }, [handle, user, communityId, userRole]);

  const handleSelectPostType = (type: PostType) => {
    setPostType(type);
    setEditingPost(null); // Clear editing post when creating new
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
  const canEditAllPosts = canEditContent; // Only owners/admins can edit all posts
  
  const buttonConfig = [
    {
      type: 'text' as PostType,
      icon: Pencil,
      color: '#C170CF',
      label: 'Text',
    },
    {
      type: 'audio' as PostType,
      icon: Mic,
      color: '#699FE5',
      label: 'Audio',
    },
    {
      type: 'video' as PostType,
      icon: Video,
      color: '#CF7770',
      label: 'Video',
    },
  ];
  
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
            {filteredPosts.map((post) => {
              // Enable edit/delete only for owners/admins in owner dashboard
              const postWithEditAccess = { ...post, _isPublicView: false, _canEdit: canEditAllPosts, _onEdit: () => handleEditPost(post) };
              
              const PostCard = (() => {
                switch (post.type) {
                  case 'text':
                  case 'image':
                    return TextPostCard;
                  case 'audio':
                    return AudioPostCard;
                  case 'video':
                    return VideoPostCard;
                  default:
                    return null;
                }
              })();
              
              return PostCard ? (
                <div key={post.id} className="break-inside-avoid mb-4">
                  <PostCard post={postWithEditAccess} />
                </div>
              ) : null;
            })}
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
