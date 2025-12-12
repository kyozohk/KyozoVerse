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

function PostList() {
  const params = useParams();
  const handle = params.handle as string;
  const { user, loading: authLoading } = useCommunityAuth();
  const [posts, setPosts] = useState<(Post & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!handle || authLoading) {
      if (!authLoading) setLoading(false);
      return;
    }

    const postsRef = collection(db, 'blogs');
    
    // Define visibility based on user authentication state
    const visibility = user ? ['public', 'private'] : ['public'];

    const postsQuery = query(
      postsRef,
      where('communityHandle', '==', handle),
      where('visibility', 'in', visibility),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (Post & { id: string })[];
      
      console.log('🌍 PUBLIC FEED - Posts loaded:', postsData.length);
      console.log('🌍 PUBLIC FEED - Post details:', postsData.map(p => ({
        id: p.id,
        type: p.type,
        title: p.title,
        visibility: p.visibility,
        hasMediaUrls: !!p.content?.mediaUrls,
        mediaUrl: p.content?.mediaUrls?.[0]
      })));
      
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
    console.log('🌍 PUBLIC FEED - Rendering post:', {
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
          <Link href={`/${handle}/${post.id}`} key={post.id}>
            <ReadCard
              category={post.type === 'image' ? 'Image' : 'Text'}
              readTime={readTime}
              date={postDate}
              title={post.title || 'Untitled'}
              summary={post.content.text}
            />
          </Link>
        );
      case 'audio':
        return (
          <Link href={`/${handle}/${post.id}`} key={post.id}>
            <ListenCard
              category="Audio"
              episode="Listen"
              duration="0:00"
              title={post.title || 'Untitled Audio'}
              summary={post.content.text}
            />
          </Link>
        );
      case 'video':
        return (
          <Link href={`/${handle}/${post.id}`} key={post.id}>
            <WatchCard
              category="Video"
              title={post.title || 'Untitled Video'}
              imageUrl={post.content.mediaUrls?.[0] || 'https://picsum.photos/seed/video-placeholder/800/600'}
              imageHint="video content"
            />
          </Link>
        );
      default:
        return null;
    }
  };
  
  if (loading) {
    return <FeedSkeletons />;
  }

  return (
    <div className="flex gap-4 md:gap-5 lg:gap-7 px-4 md:px-6 lg:px-8 h-full">
      {[0, 1, 2].map(colIndex => (
        <div key={colIndex} className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="space-y-4 md:space-y-5 lg:space-y-7 py-4 md:py-6 lg:py-8 px-2">
            {posts
              .filter((_, index) => index % 3 === colIndex)
              .map(renderPost)}
          </div>
        </div>
      ))}
    </div>
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

  const openSignInDialog = () => setDialogState({ ...dialogState, isSignInOpen: true });

  const openSignUpDialog = useCallback(() => {
    setDialogState({ isSignInOpen: false, isSignUpOpen: true, isResetPasswordOpen: false, showPrivacyPolicy: false });
  }, [setDialogState]);
  
  useEffect(() => {
    // If the signup param is present, open the signup dialog
    if (searchParams.get('signup') === 'true') {
      openSignUpDialog();
    }
  }, [searchParams, openSignUpDialog]);

  useEffect(() => {
    async function fetchCommunityData() {
      if (!handle) return;
      const data = await getCommunityByHandle(handle);
      setCommunityData(data);
    }
    fetchCommunityData();
  }, [handle]);

  // Check if user is a member of this community
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
        console.error('Error checking membership:', error);
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
      
      await setDoc(memberRef, {
        userId: user.uid,
        communityId: communityData.communityId,
        role: 'member',
        joinedAt: serverTimestamp(),
        userDetails: {
          displayName: user.displayName || user.email,
          email: user.email,
          avatarUrl: user.photoURL || '',
        }
      });

      // Update community member count
      const communityRef = doc(db, 'communities', communityData.communityId);
      await updateDoc(communityRef, {
        memberCount: increment(1)
      });

      setIsMember(true);
      // Show success toast if available
      console.log('Successfully joined community!');
    } catch (error) {
      console.error('Error joining community:', error);
      alert('Failed to join community. Please try again.');
    }
    setJoiningCommunity(false);
  };
  
  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="sticky top-0 z-50 relative w-full bg-[rgba(245,241,232,0.15)] backdrop-blur-sm border-b border-[rgba(79,91,102,0.08)]">
        <div className="flex flex-row items-center w-full">
          <div className="content-stretch flex items-center justify-between px-4 md:px-8 lg:px-12 py-3 md:py-3.5 lg:py-4 relative w-full">
            <p className="font-['DM_Sans',sans-serif] font-bold leading-tight md:leading-[30px] lg:leading-[36.029px] relative shrink-0 text-[#93adae] text-[24px] md:text-[30px] lg:text-[36.696px] tracking-[-1px] md:tracking-[-1.2px] lg:tracking-[-1.3344px]">
              {communityData?.name || 'Community'}
            </p>
            <div className="flex items-center gap-4">
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
      <div id="grid-container" className="h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] lg:h-[calc(100vh-120px)] overflow-hidden">
        <Suspense fallback={<FeedSkeletons />}>
          <PostList />
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
