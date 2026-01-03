
'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc, setDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { getCommunityByHandle } from '@/lib/community-utils';
import { type Post, type Community } from '@/lib/types';
import { ReadCard } from '@/components/content-cards/read-card';
import { ImageCard } from '@/components/content-cards/image-card';
import { ListenCard } from '@/components/content-cards/listen-card';
import { ListenCardHorizontal } from '@/components/content-cards/listen-card-horizontal';
import { WatchCard } from '@/components/content-cards/watch-card';
import { FeedSkeletons } from '@/components/community/feed/skeletons';
import Link from 'next/link';
import '@/components/content-cards/content-cards.css';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useCommunityAuth } from '@/hooks/use-community-auth';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/layout/user-menu';
import { useAuthAndDialog } from '@/hooks/use-auth-and-dialog';
import { PrivacyPolicyDialog } from '@/components/auth/privacy-policy-dialog';
import { SignupDialog } from '@/components/community/signup-dialog';
import { PostDetailPanel } from '@/components/community/feed/post-detail-panel';
import { ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function PostList({ filter }: { filter: string }) {
  const params = useParams();
  const handle = params.handle as string;
  const { user, loading: authLoading } = useCommunityAuth();
  const [posts, setPosts] = useState<(Post & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<(Post & { id: string }) | null>(null);

  useEffect(() => {
    if (!handle) {
      setLoading(false);
      return;
    }

    const postsRef = collection(db, 'blogs');
    let postsQuery;

    if (user) {
        postsQuery = query(
            postsRef,
            where('communityHandle', '==', handle),
            where('visibility', 'in', ['public', 'private']),
            orderBy('createdAt', 'desc')
        );
    } else {
        postsQuery = query(
            postsRef,
            where('communityHandle', '==', handle),
            where('visibility', '==', 'public'),
            orderBy('createdAt', 'desc')
        );
    }

    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (Post & { id: string })[];
      
      console.log('🌍 PUBLIC FEED - Posts loaded:', postsData.length);
      
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching posts:', error);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'blogs',
        operation: 'list'
      }));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [handle, user, authLoading]);
  
  const renderPost = (post: Post & { id: string }) => {
    return (
      <div key={post.id} onClick={() => setSelectedPost(post)} className={`break-inside-avoid mb-6 cursor-pointer`}>
        {post.type === 'audio' ? (
          <ListenCard
            post={{ ...post, _isPublicView: true }}
            category="Audio"
            episode="Listen"
            duration="0:00"
            title={post.title || 'Untitled Audio'}
            summary={post.content.text}
          />
        ) : post.type === 'video' ? (
          <WatchCard
            post={{ ...post, _isPublicView: true }}
            category="Video"
            title={post.title || 'Untitled Video'}
            imageUrl={post.content.mediaUrls?.[0] || 'https://picsum.photos/seed/video-placeholder/800/600'}
            imageHint="video content"
          />
        ) : post.type === 'image' ? (
          <ImageCard
            post={{ ...post, _isPublicView: true }}
            category="Image"
            readTime={`${Math.max(1, Math.ceil((post.content.text?.length || 0) / 1000))} min read`}
            date={post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Dec 2024'}
            title={post.title || 'Untitled'}
            summary={post.content.text}
            imageUrl={post.content.mediaUrls?.[0] || 'https://picsum.photos/seed/image-placeholder/800/600'}
          />
        ) : (
          <ReadCard
            post={{ ...post, _isPublicView: true }}
            category="Text"
            readTime={`${Math.max(1, Math.ceil((post.content.text?.length || 0) / 1000))} min read`}
            date={post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Dec 2024'}
            title={post.title || 'Untitled'}
            summary={post.content.text}
          />
        )}
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="masonry-feed-columns">
        <FeedSkeletons />
      </div>
    );
  }

  const filteredPosts = posts.filter((post) => {
    if (filter === 'all') return true;
    if (filter === 'read') return post.type === 'text' || post.type === 'image';
    if (filter === 'listen') return post.type === 'audio';
    if (filter === 'watch') return post.type === 'video';
    return true;
  });

  // Get first audio post for top placement, rest stay in feed
  const firstAudioPost = filteredPosts.find(post => post.type === 'audio');
  const feedPosts = firstAudioPost 
    ? filteredPosts.filter(post => post.id !== firstAudioPost.id)
    : filteredPosts;

  return (
    <>
      {/* First audio post - full width at top */}
      {firstAudioPost && (
        <div className="mb-8">
          <div onClick={() => setSelectedPost(firstAudioPost)} className="cursor-pointer">
            <ListenCardHorizontal
              post={{ ...firstAudioPost, _isPublicView: true }}
              category="Audio"
              episode="Listen"
              duration="0:00"
              title={firstAudioPost.title || 'Untitled Audio'}
              summary={firstAudioPost.content.text}
            />
          </div>
        </div>
      )}
      
      {/* All other posts - masonry grid */}
      <div className="masonry-feed-columns">
        {feedPosts.map(renderPost)}
      </div>
      
      <PostDetailPanel
        post={selectedPost}
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
      />
    </>
  );
}

export default function PublicCommunityPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const handle = params.handle as string;
  const { 
    user, 
    loading: authLoading, 
    dialogState,
    setDialogState,
    formState,
    handleFormChange,
    handleCheckboxChange,
    handleSignUp,
    handleSignIn,
    handleSignInWithGoogle,
    handleToggleMode
  } = useAuthAndDialog();

  const [communityData, setCommunityData] = useState<Community | null>(null);
  const [isMember, setIsMember] = useState<boolean>(false);
  const [checkingMembership, setCheckingMembership] = useState<boolean>(true);
  const [joiningCommunity, setJoiningCommunity] = useState<boolean>(false);
  const [filter, setFilter] = useState<string>('all');

  const openSignInDialog = () => setDialogState({ ...dialogState, isSignInOpen: true });

  const openSignUpDialog = useCallback(() => {
    setDialogState({ isSignInOpen: false, isSignUpOpen: true, isResetPasswordOpen: false, showPrivacyPolicy: false });
  }, [setDialogState]);
  
  useEffect(() => {
    if (searchParams.get('signup') === 'true') {
      openSignUpDialog();
    }
  }, [searchParams, openSignUpDialog]);

  useEffect(() => {
    const firstName = searchParams.get('firstName');
    const lastName = searchParams.get('lastName');
    const email = searchParams.get('email');
    
    if (dialogState.isSignUpOpen && (firstName || lastName || email)) {
      if (firstName && formState.firstName !== firstName) {
        handleFormChange('firstName', firstName);
      }
      if (lastName && formState.lastName !== lastName) {
        handleFormChange('lastName', lastName);
      }
      if (email && formState.email !== email) {
        handleFormChange('email', email);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogState.isSignUpOpen, searchParams]);

  useEffect(() => {
    async function fetchCommunityData() {
      if (!handle) return;
      const data = await getCommunityByHandle(handle);
      setCommunityData(data);
    }
    fetchCommunityData();
  }, [handle]);

  useEffect(() => {
    async function checkMembership() {
      if (!user || !communityData) {
        setCheckingMembership(false);
        setIsMember(false);
        return;
      }

      setCheckingMembership(true);
      try {
        const memberDocId = `${user.uid}_${communityData.communityId}`;
        const memberRef = doc(db, 'communityMembers', memberDocId);
        const memberSnap = await getDoc(memberRef);
        
        setIsMember(memberSnap.exists());
      } catch (error) {
        console.error('❌ Error checking membership:', error);
        setIsMember(false);
      }
      setCheckingMembership(false);
    }

    checkMembership();
  }, [user, communityData]);

  const handleJoinCommunity = async () => {
    if (!user || !communityData) return;

    setJoiningCommunity(true);
    try {
      const memberDocId = `${user.uid}_${communityData.communityId}`;
      const memberRef = doc(db, 'communityMembers', memberDocId);
      
      const memberData = {
        userId: user.uid,
        communityId: communityData.communityId,
        role: 'member',
        joinedAt: serverTimestamp(),
        userDetails: {
          displayName: user.displayName || user.email,
          email: user.email,
          avatarUrl: user.photoURL || '',
        }
      };
      
      await setDoc(memberRef, memberData);
      
      const communityRef = doc(db, 'communities', communityData.communityId);
      await updateDoc(communityRef, {
        memberCount: increment(1)
      });
      
      setIsMember(true);
      alert('Successfully joined the community!');
    } catch (error) {
      console.error('❌ Error joining community:', error);
      alert('Failed to join community. Please try again.');
    }
    setJoiningCommunity(false);
  };
  
  return (
    <div className="min-h-screen bg-no-repeat bg-cover bg-center bg-fixed relative" style={{ backgroundImage: `url(/bg/public-feed-bg.jpg)` }}>
      {/* 20% white overlay */}
      <div className="absolute inset-0 bg-[#D9D9D9]/70"></div>
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-sm relative">
        <div className="w-full px-6 py-4 flex items-center justify-between">
          {/* Left - Community Name with Dropdown */}
          <button className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors group">
            <span className="text-lg font-semibold uppercase tracking-wide">
              {communityData?.name?.toUpperCase() || 'COMMUNITY'}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
          </button>

          {/* Center - Filter Buttons */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === 'all'
                  ? 'bg-gray-700 text-white shadow-md '
                  : 'bg-white/60 text-gray-700 hover:bg-white/80 '
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === 'read'
                  ? 'bg-[#926B7F] text-white shadow-md'
                  : 'bg-white/60 text-gray-600 hover:bg-white/80'
              }`}
            >
              Read
            </button>
            <button
              onClick={() => setFilter('listen')}
              className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === 'listen'
                  ? 'bg-[#6E94B1] text-white shadow-md'
                  : 'bg-white/60 text-gray-600 hover:bg-white/80'
              }`}
            >
              Listen
            </button>
            <button
              onClick={() => setFilter('watch')}
              className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === 'watch'
                  ? 'bg-[#F0C679] text-black shadow-md'
                  : 'bg-white/60 text-gray-600 hover:bg-white/80'
              }`}
            >
              Watch
            </button>
          </div>

          {/* Right - User Menu */}
          <div className="flex items-center gap-3">
            {!authLoading && (
              user ? (
                <>
                  {!checkingMembership && !isMember && (
                    <Button 
                      onClick={handleJoinCommunity}
                      disabled={joiningCommunity}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-4"
                    >
                      {joiningCommunity ? 'Joining...' : 'Join'}
                    </Button>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700 font-medium">{user.displayName || 'User'}</span>
                    <Avatar className="h-8 w-8 cursor-pointer">
                      <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                      <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
                        {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={openSignInDialog} className="text-gray-700 hover:text-gray-900">Sign In</Button>
                  <Button size="sm" onClick={openSignUpDialog} className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-4">Join</Button>
                </>
              )
            )}
          </div>
        </div>
      </div>

      {/* Content Area with proper spacing */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 pt-8 pb-12">
        <Suspense fallback={<FeedSkeletons />}>
          <PostList filter={filter} />
        </Suspense>
      </div>

      <SignupDialog
        isOpen={dialogState.isSignUpOpen || dialogState.isSignInOpen}
        onClose={() => setDialogState({ ...dialogState, isSignUpOpen: false, isSignInOpen: false })}
        isSignup={dialogState.isSignUpOpen}
        communityName={communityData?.name}
        firstName={formState.firstName}
        lastName={formState.lastName}
        email={formState.email}
        phone={formState.phone}
        password={formState.password}
        agreedToPrivacy={formState.agreedToPrivacy}
        error={formState.error}
        onFirstNameChange={(value) => handleFormChange('firstName', value)}
        onLastNameChange={(value) => handleFormChange('lastName', value)}
        onEmailChange={(value) => handleFormChange('email', value)}
        onPhoneChange={(value) => handleFormChange('phone', value)}
        onPasswordChange={(value) => handleFormChange('password', value)}
        onAgreedToPrivacyChange={(value) => handleCheckboxChange('agreedToPrivacy', value)}
        onSubmit={dialogState.isSignUpOpen ? handleSignUp : handleSignIn}
        onGoogleSignIn={handleSignInWithGoogle}
        onToggleMode={handleToggleMode}
        onShowPrivacyPolicy={() => setDialogState({ ...dialogState, showPrivacyPolicy: true })}
      />
      
      <PrivacyPolicyDialog
        open={dialogState.showPrivacyPolicy}
        onOpenChange={(open) => setDialogState({ ...dialogState, showPrivacyPolicy: open })}
      />
    </div>
  );
}
