
'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc, setDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { getCommunityByHandle } from '@/lib/community-utils';
import { type Post, type Community } from '@/lib/types';
import { ReadCard } from '@/components/content-cards/read-card';
import { ListenCard } from '@/components/content-cards/listen-card';
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
      <div key={post.id} onClick={() => setSelectedPost(post)} className="break-inside-avoid mb-6 cursor-pointer">
        {post.type === 'audio' ? (
          <ListenCard
            post={post}
            category="Audio"
            episode="Listen"
            duration="0:00"
            title={post.title || 'Untitled Audio'}
            summary={post.content.text}
          />
        ) : post.type === 'video' ? (
          <WatchCard
            post={post}
            category="Video"
            title={post.title || 'Untitled Video'}
            imageUrl={post.content.mediaUrls?.[0] || 'https://picsum.photos/seed/video-placeholder/800/600'}
            imageHint="video content"
          />
        ) : (
          <ReadCard
            post={post}
            category={post.type === 'image' ? 'Image' : 'Text'}
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

  return (
    <>
      <div className="masonry-feed-columns">
        {filteredPosts.map(renderPost)}
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
    <div className="min-h-screen bg-no-repeat bg-cover bg-center" style={{ backgroundImage: `url(/bg/light_app_bg.png)` }}>
      <div className="sticky top-0 z-50 relative w-full bg-transparent">
        <div className="flex flex-row items-center w-full">
          <div className="content-stretch flex items-center justify-between px-4 md:px-8 lg:px-12 py-3 md:py-3.5 lg:py-4 relative w-full">
            <p className="font-['DM_Sans',sans-serif] font-bold leading-tight md:leading-[30px] lg:leading-[36.029px] relative shrink-0 text-[#93adae] text-[24px] md:text-[30px] lg:text-[36.696px] tracking-[-1px] md:tracking-[-1.2px] lg:tracking-[-1.3344px]">
              {communityData?.name || 'Community'}
            </p>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-1 bg-white/50 backdrop-blur-sm rounded-full p-1">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'bg-transparent text-gray-600 hover:bg-white/70'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('read')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === 'read'
                       ? 'bg-white text-gray-800 shadow-sm'
                      : 'bg-transparent text-gray-600 hover:bg-white/70'
                  }`}
                >
                  Read
                </button>
                <button
                  onClick={() => setFilter('listen')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === 'listen'
                       ? 'bg-white text-gray-800 shadow-sm'
                      : 'bg-transparent text-gray-600 hover:bg-white/70'
                  }`}
                >
                  Listen
                </button>
                <button
                  onClick={() => setFilter('watch')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === 'watch'
                       ? 'bg-white text-gray-800 shadow-sm'
                      : 'bg-transparent text-gray-600 hover:bg-white/70'
                  }`}
                >
                  Watch
                </button>
              </div>
              
              {!authLoading && (
                user ? (
                  <>
                    {!checkingMembership && !isMember && (
                      <Button 
                        onClick={handleJoinCommunity}
                        disabled={joiningCommunity}
                        className="bg-[#843484] hover:bg-[#6b2a6b]"
                      >
                        {joiningCommunity ? 'Joining...' : 'Join Community'}
                      </Button>
                    )}
                    <UserMenu />
                  </>
                ) : (
                  <>
                    <Button variant="ghost" onClick={openSignInDialog}>Sign In</Button>
                    <Button onClick={openSignUpDialog}>Join Community</Button>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      </div>
      <div id="grid-container" className="px-4 md:px-6 lg:px-8">
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
