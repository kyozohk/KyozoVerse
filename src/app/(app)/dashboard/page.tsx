"use client";

import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { PostCardSkeleton } from "@/components/feed/post-card-skeleton";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThumbsUp, MessageSquare, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type Post, type User } from '@/lib/types';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function DashboardPage() {
  const { user } = useAuth();
  const [newPostContent, setNewPostContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [posts, setPosts] = useState<(Post & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "blogs"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const postsData: (Post & { id: string })[] = [];
      for (const postDoc of querySnapshot.docs) {
        const postData = postDoc.data() as Post;
        
        let authorData: User | null = null;
        if(postData.authorId) {
            const userRef = doc(db, "users", postData.authorId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                authorData = userSnap.data() as User;
            }
        }
        
        postsData.push({
          id: postDoc.id,
          ...postData,
          author: authorData || { userId: 'unknown', displayName: 'Unknown User' },
          createdAt: postData.createdAt?.toDate(),
        });
      }
      setPosts(postsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreatePost = async () => {
    if (!user || !newPostContent.trim()) return;

    try {
      await addDoc(collection(db, "blogs"), {
        type: 'text',
        content: { text: newPostContent },
        authorId: user.uid,
        likes: 0,
        comments: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        visibility: isPublic ? 'public' : 'private',
      });
      setNewPostContent('');
      setIsPublic(true);
      toast({
        title: "Success",
        description: "Your post has been published.",
      });
    } catch (error) {
      console.error("Error creating post: ", error);
      toast({
        title: "Error",
        description: "Could not create post. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Your Feed</h1>
        <p className="text-muted-foreground">Catch up on what's happening in your communities.</p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4 pb-0">
          <div className="flex gap-4">
            <Avatar>
              <AvatarImage src={user?.photoURL || undefined} />
              <AvatarFallback>{user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <Textarea
              placeholder="What's on your mind?"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center p-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="is-public" checked={isPublic} onCheckedChange={(checked) => setIsPublic(Boolean(checked))} />
            <Label htmlFor="is-public" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Public
            </Label>
          </div>
          <Button onClick={handleCreatePost} disabled={!newPostContent.trim()}>Post</Button>
        </CardFooter>
      </Card>

      <div className="space-y-6">
        {loading ? (
          <>
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </>
        ) : (
          posts.map((post) => (
            <Card key={post.id}>
              <CardHeader className="flex flex-row items-center gap-4">
                <Avatar>
                  <AvatarImage src={post.author?.avatarUrl} />
                  <AvatarFallback>{post.author?.displayName?.charAt(0) || post.author?.handle?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-bold">{post.author?.displayName}</p>
                    <p className="text-sm text-muted-foreground">
                        {post.author?.handle} &middot; {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4">{post.content.text}</p>
                {post.content.mediaUrls?.[0] && (
                    <Image src={post.content.mediaUrls[0]} alt="Post image" width={600} height={400} className="rounded-md" />
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
    </div>
  );
}
