
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, doc, getDoc, where } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { storage } from '@/firebase/storage';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from '@/hooks/use-auth';
import { PostCardSkeleton } from "@/components/feed/post-card-skeleton";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThumbsUp, MessageSquare, Share2, UploadCloud, X, Users, Settings, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type Post, type User, type UserRole, type Community } from '@/lib/types';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useDropzone } from 'react-dropzone';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { getCommunityByHandle, getUserRoleInCommunity } from '@/lib/community-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function Dropzone({ onFileChange, file }: { onFileChange: (file: File | null) => void, file: File | null }) {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles?.length) {
            onFileChange(acceptedFiles[0]);
        }
    }, [onFileChange]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        maxFiles: 1,
    });

    return (
        <div>
            {!file ? (
                <div
                    {...getRootProps()}
                    className={`mt-2 flex justify-center rounded-lg border border-dashed border-input px-6 py-10 ${isDragActive ? 'bg-accent' : ''}`}
                >
                    <div className="text-center">
                        <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                        <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                            <label
                                htmlFor="file-upload"
                                className="relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:text-primary/80"
                            >
                                <span>Upload a file</span>
                                <input {...getInputProps()} id="file-upload" className="sr-only" />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs leading-5 text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                    </div>
                </div>
            ) : (
                <div className="mt-2 relative">
                    <Image
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        width={600}
                        height={400}
                        className="w-full h-auto rounded-md"
                    />
                    <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => onFileChange(null)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}

export default function CommunityFeedPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [postImage, setPostImage] = useState<File | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [posts, setPosts] = useState<(Post & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [community, setCommunity] = useState<Community | null>(null);
  const [activeTab, setActiveTab] = useState('feed');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinFormData, setJoinFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: ''
  });
  
  const { toast } = useToast();
  const params = useParams();
  const handle = params.handle as string;
  
  console.log('[handle]/page.tsx - Component rendered', { 
    handle, 
    isAuthenticated: !!user, 
    authLoading
  });
  
  // Fetch community data and user role
  useEffect(() => {
    async function fetchCommunityAndRole() {
      if (!handle) return;
      
      try {
        const communityData = await getCommunityByHandle(handle);
        console.log('Community data:', communityData);
        
        if (communityData) {
          setCommunity(communityData);
          
          if (user) {
            const role = await getUserRoleInCommunity(user.uid, communityData.communityId);
            console.log('User role in community:', role);
            setUserRole(role);
            
            // If user is owner, default to dashboard tab
            if (role === 'owner' || role === 'admin') {
              setActiveTab('dashboard');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching community data:', error);
      }
    }
    
    fetchCommunityAndRole();
  }, [handle, user]);

  useEffect(() => {
    console.log('[handle]/page.tsx - useEffect triggered', { handle, user: !!user, userRole });
    if (!handle || !community) {
      console.log('[handle]/page.tsx - No handle or community found, returning');
      return;
    }

    const postsCollection = collection(db, "blogs");
    
    // This is the core change: we construct different queries based on auth state.
    const constraints = [];
    constraints.push(where("communityHandle", "==", handle));
    
    // If the user is not logged in, we MUST add a `where` clause for visibility
    // to satisfy the Firestore security rules for public access.
    if (!user) {
        constraints.push(where("visibility", "==", "public"));
    }
    // For members, admins, and owners, we'll filter on the client side
    
    constraints.push(orderBy("createdAt", "desc"));
    
    const q = query(postsCollection, ...constraints);

    console.log('[handle]/page.tsx - Setting up Firestore query', { handle, userRole, constraints });
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      console.log('[handle]/page.tsx - Received Firestore snapshot', { docsCount: querySnapshot.docs.length });
      const postsData: (Post & { id: string })[] = [];
      for (const postDoc of querySnapshot.docs) {
        const postData = postDoc.data() as Post;
        
        let authorData: User | null = null;
        if(postData.authorId) {
            try {
                const userRef = doc(db, "users", postData.authorId);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    authorData = userSnap.data() as User;
                }
            } catch (error) {
                // If we can't fetch author, proceed without it.
                // This could be a permissions issue for private user data.
            }
        }
        
        postsData.push({
          id: postDoc.id,
          ...postData,
          author: authorData || { userId: 'unknown', displayName: 'Unknown User' },
          createdAt: postData.createdAt?.toDate(),
        });
      }
      // For logged-in users, we might get private posts from the query,
      // so we filter them on the client side. Logged-out users only get public posts.
      const visiblePosts = user ? postsData : postsData.filter(p => p.visibility === 'public');
      setPosts(visiblePosts);
      setLoading(false);
    }, (error) => {
        console.error('[handle]/page.tsx - Firestore error', error);
        const permissionError = new FirestorePermissionError({
            path: `blogs where communityHandle == ${handle}`,
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [handle, user]);

  const handleCreatePost = async () => {
    if (!user || !community || (!newPostContent.trim() && !postImage)) return;
    setIsSubmitting(true);

    try {
        let mediaUrl = '';
        if (postImage) {
            const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${postImage.name}`);
            const uploadResult = await uploadBytes(storageRef, postImage);
            mediaUrl = await getDownloadURL(uploadResult.ref);
        }

        // Determine visibility based on user role
        let visibility = isPublic ? 'public' : 'members-only';
        if (userRole === 'owner' || userRole === 'admin') {
          visibility = isPublic ? 'public' : 'private';
        }

        const postData = {
            title: newPostTitle,
            content: { 
                text: newPostContent,
                mediaUrls: mediaUrl ? [mediaUrl] : []
            },
            authorId: user.uid,
            communityHandle: handle,
            communityId: community.communityId,
            likes: 0,
            comments: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            visibility: visibility,
            type: postImage ? 'image' : 'text',
        };

      addDoc(collection(db, "blogs"), postData)
        .then(() => {
          setNewPostTitle('');
          setNewPostContent('');
          setPostImage(null);
          setIsPublic(true);
          toast({
            title: "Success",
            description: "Your post has been published.",
          });
        })
        .catch(async (serverError) => {
            console.error("Server error creating post:", serverError);
            const permissionError = new FirestorePermissionError({
                path: '/blogs',
                operation: 'create',
                requestResourceData: postData,
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({
              title: "Error",
              description: "Could not create post. You may not have permission.",
              variant: "destructive",
            });
        });
    } catch (error) {
      // This catch block is for client-side errors (e.g., storage upload)
      console.error("Error creating post: ", error);
      toast({
        title: "Error",
        description: "Could not create post. Please try again.",
        variant: "destructive",
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  // Handle joining the community
  const handleJoinCommunity = () => {
    if (!user) {
      setShowJoinForm(true);
    } else if (community) {
      // User is logged in but not a member
      joinCommunity(user.uid, community.communityId, {
        displayName: user.displayName || '',
        email: user.email || '',
        avatarUrl: user.photoURL || ''
      }).then(() => {
        toast({
          title: "Success",
          description: `You've joined ${community.name}!`,
        });
        // Refresh user role
        getUserRoleInCommunity(user.uid, community.communityId).then(role => {
          setUserRole(role);
        });
      }).catch(error => {
        console.error("Error joining community:", error);
        toast({
          title: "Error",
          description: "Could not join community. Please try again.",
          variant: "destructive",
        });
      });
    }
  };

  // Handle join form success
  const handleJoinSuccess = () => {
    setShowJoinForm(false);
    // The user will be automatically logged in and the page will refresh
  };

  // Render post creation form
  const renderPostCreationForm = () => {
    if (!user || userRole === 'guest') return null;
    
    return (
      <Card className="mb-6">
        <CardContent className="p-4 pb-0">
          <div className="flex gap-4">
            <Avatar>
              <AvatarImage src={user?.photoURL || undefined} />
              <AvatarFallback>{user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
                <Input
                    placeholder="Title"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    className="flex-1 font-bold"
                />
                <Textarea
                  placeholder="What's on your mind?"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="flex-1"
                />
            </div>
          </div>
          <Dropzone onFileChange={setPostImage} file={postImage} />
        </CardContent>
        <CardFooter className="flex justify-between items-center p-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="is-public" checked={isPublic} onCheckedChange={(checked) => setIsPublic(Boolean(checked))} />
            <Label htmlFor="is-public" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {userRole === 'owner' || userRole === 'admin' ? 'Public' : 'Visible to all'}
            </Label>
          </div>
          <Button onClick={handleCreatePost} disabled={isSubmitting || (!newPostContent.trim() && !postImage)}>
            {isSubmitting ? 'Posting...' : 'Post'}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  // Render posts feed
  const renderFeed = () => {
    return (
      <div className="space-y-6">
        {loading ? (
          <>
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </>
        ) : posts.length === 0 ? (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold">Nothing to see here yet</h2>
                <p className="text-muted-foreground">Be the first to post in this community!</p>
            </div>
        ) : (
          posts.map((post) => (
            <Card key={post.id}>
              <CardHeader className="flex flex-row items-center gap-4">
                <Avatar>
                  <AvatarImage src={post.author?.avatarUrl} />
                  <AvatarFallback>{post.author?.displayName?.charAt(0) || (post.author as any)?.handle?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-bold">{post.author?.displayName}</p>
                    <p className="text-sm text-muted-foreground">
                        {(post.author as any)?.handle ? `@${(post.author as any).handle}` : ''} &middot; {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}
                    </p>
                </div>
              </CardHeader>
              <CardContent>
                {post.title && <h2 className="text-xl font-semibold mb-2">{post.title}</h2>}
                {post.content.text && <p className="mb-4">{post.content.text}</p>}
                {post.content.mediaUrls?.[0] && (
                    <Image src={post.content.mediaUrls[0]} alt={post.title || "Post image"} width={600} height={400} className="rounded-md" />
                )}
              </CardContent>
               <CardFooter className="flex items-center gap-4 text-muted-foreground">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <ThumbsUp className="h-4 w-4" />
                    <span>{post.likes}</span>
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>{post.comments}</span>
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 ml-auto">
                    <Share2 className="h-4 w-4" />
                    <span>Share</span>
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    );
  };

  // Import the components
  const { JoinForm } = require('@/components/community/join-form');
  const { CommunityDashboard } = require('@/components/community/dashboard');

  // Main render
  return (
    <div className="container mx-auto max-w-4xl">
      {/* Community Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">@{handle}</h1>
            <p className="text-muted-foreground">
              {community?.tagline || "Catch up on what's happening in the community."}
            </p>
          </div>
          
          {/* Join button for guests */}
          {userRole === 'guest' && (
            <Button onClick={handleJoinCommunity}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Join Community
            </Button>
          )}
        </div>
      </div>

      {/* Join Form Modal */}
      {showJoinForm && community && (
        <div className="mb-6">
          <JoinForm 
            communityId={community.communityId} 
            communityName={community.name} 
            onSuccess={handleJoinSuccess}
            onCancel={() => setShowJoinForm(false)}
          />
        </div>
      )}

      {/* Tabs for owners and admins */}
      {(userRole === 'owner' || userRole === 'admin') && community ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="feed">Community Feed</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          </TabsList>
          <TabsContent value="feed" className="mt-4">
            {renderPostCreationForm()}
            {renderFeed()}
          </TabsContent>
          <TabsContent value="dashboard" className="mt-4">
            <CommunityDashboard community={community} userId={user?.uid || ''} />
          </TabsContent>
        </Tabs>
      ) : (
        // Regular feed for members and guests
        <>
          {renderPostCreationForm()}
          {renderFeed()}
        </>
      )}
    </div>
  );
}

    