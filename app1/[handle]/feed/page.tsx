
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { FeedSkeletons } from '@/components/community/feed/skeletons';
import { getUserRoleInCommunity, getCommunityByHandle } from '@/lib/community-utils';
import { type Post, type User, type Community } from '@/lib/types';
import { PostType } from '@/components/community/feed/create-post-buttons';
import { CreatePostDialog } from '@/components/community/feed/create-post-dialog';
import { Pencil, Mic, Video, Image, ChevronDown, ExternalLink } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { ReadCard } from '@/components/content-cards/read-card';
import { ImageCard } from '@/components/content-cards/image-card';
import { ListenCard } from '@/components/content-cards/listen-card';
import { ListenCardHorizontal } from '@/components/content-cards/listen-card-horizontal';
import { WatchCard } from '@/components/content-cards/watch-card';
import { PostDetailPanel } from '@/components/community/feed/post-detail-panel';
import Link from 'next/link';
import { FeedStats } from '@/components/community/feed-stats';
import { CommunityHeader } from '@/components/community/community-header';
import { CustomButton } from '@/components/ui';

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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [memberCount, setMemberCount] = useState<number>(0);

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
        
        // Fetch actual member count from communityMembers collection
        if (communityData) {
          const membersQuery = query(
            collection(db, "communityMembers"), 
            where("communityId", "==", communityData.communityId)
          );
          const membersSnapshot = await getDocs(membersQuery);
          // Exclude owner from count
          const nonOwnerCount = membersSnapshot.docs.filter(doc => {
            const data = doc.data();
            return data.role !== 'owner';
          }).length;
          setMemberCount(nonOwnerCount);
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
      console.error('❌ Firestore query error in feed:', error);
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
  const canCreatePost = !!user; // All authenticated users can create posts
  
  console.log('🔐 Feed permissions:', { userRole, canManageContent, canCreatePost, userId: user?.uid });
  
  const buttonConfig = [
    { type: 'text' as PostType, icon: Pencil, color: '#926B7F', label: 'Text' },
    { type: 'image' as PostType, icon: Image, color: '#926B7F', label: 'Image' },
    { type: 'audio' as PostType, icon: Mic, color: '#6E94B1', label: 'Audio' },
    { type: 'video' as PostType, icon: Video, color: '#F0C679', label: 'Video' },
  ];

  const renderPost = (post: Post & { id: string }) => {
    const canEditThisPost = canManageContent || (user && post.authorId === user.uid);
    
    const commonProps = {
      key: post.id,
      post: {
        ...post,
        _canEdit: canEditThisPost,
        _onEdit: () => handleEditPost(post),
        _isPublicView: false,
      }
    };

    const postContent = (
      <>
        {post.type === 'audio' ? (
          <ListenCard {...commonProps} category="Audio" episode="Listen" duration="0:00" title={post.title || 'Untitled Audio'} summary={post.content.text} isPrivate={post.visibility === 'private'} />
        ) : post.type === 'video' ? (
          <WatchCard {...commonProps} category="Video" title={post.title || 'Untitled Video'} imageUrl={post.content.mediaUrls?.[0] || 'https://picsum.photos/seed/video-placeholder/800/600'} imageHint="video content" isPrivate={post.visibility === 'private'} />
        ) : post.type === 'image' ? (
          <ImageCard {...commonProps} category="Image" readTime={`${Math.max(1, Math.ceil((post.content.text?.length || 0) / 1000))} min read`} date={post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Dec 2024'} title={post.title || 'Untitled'} summary={post.content.text} imageUrl={post.content.mediaUrls?.[0] || 'https://picsum.photos/seed/image-placeholder/800/600'} isPrivate={post.visibility === 'private'} />
        ) : (
          <ReadCard {...commonProps} category="Text" readTime={`${Math.max(1, Math.ceil((post.content.text?.length || 0) / 1000))} min read`} date={post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Dec 2024'} title={post.title || 'Untitled'} summary={post.content.text} isPrivate={post.visibility === 'private'} />
        )}
      </>
    );

    return (
      <div key={post.id} onClick={() => setSelectedPost(post)} className="break-inside-avoid mb-6 cursor-pointer">
        {postContent}
      </div>
    );
  };
  
  // Get first audio post for top placement, rest stay in feed
  const firstAudioPost = filteredPosts.find(post => post.type === 'audio');
  const feedPosts = firstAudioPost 
    ? filteredPosts.filter(post => post.id !== firstAudioPost.id)
    : filteredPosts;

  // Calculate member count excluding owner
  const nonOwnerMembers = members.filter(m => m.role !== 'owner');
  const memberCountExcludingOwner = nonOwnerMembers.length;

  return (
    <div className="space-y-0">
      {community && (
        <CommunityHeader 
          community={community} 
          userRole={userRole as any} 
          memberCount={memberCount}
          customActions={
            canCreatePost ? (
              <>
                {buttonConfig.map((config) => (
                  <CustomButton
                    key={config.type}
                    variant="rounded-rect"
                    className="text-white/80 hover:text-white hover:bg-white/10"
                    onClick={() => handleSelectPostType(config.type)}
                  >
                    <config.icon className="h-4 w-4 mr-2" />
                    {config.label}
                  </CustomButton>
                ))}
                <div className="flex-grow"></div>
                <CustomButton
                  variant="rounded-rect"
                  className="text-white/80 hover:text-white hover:bg-white/10"
                  onClick={() => window.open(`https://www.kyozo.com/${handle}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Public View
                </CustomButton>
              </>
            ) : undefined
          }
        />
      )}
      <div className="min-h-screen relative">
        {/* Content Area */}
        <div className="relative z-10 max-w-[1400px] mx-auto px-6 pt-8 pb-12">
          <FeedStats posts={posts} />

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
            <>
              {/* First audio post - full width at top */}
              {firstAudioPost && (
                <div className="mb-8">
                  <div onClick={() => setSelectedPost(firstAudioPost)} className="cursor-pointer">
                    <ListenCardHorizontal
                      post={{
                        ...firstAudioPost,
                        _canEdit: canManageContent || (user && firstAudioPost.authorId === user.uid),
                        _onEdit: () => handleEditPost(firstAudioPost),
                        _isPublicView: false,
                      }}
                      category="Audio"
                      episode="Listen"
                      duration="0:00"
                      title={firstAudioPost.title || 'Untitled Audio'}
                      summary={firstAudioPost.content.text}
                      isPrivate={firstAudioPost.visibility === 'private'}
                    />
                  </div>
                </div>
              )}
              
              {/* All other posts - masonry grid */}
              <div className="masonry-feed-columns">
                {feedPosts.map(renderPost)}
              </div>
            </>
          )}
        </div>
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
    </div>
  );
}
