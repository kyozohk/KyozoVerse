"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThumbsUp, MessageSquare, Share2, Filter } from "lucide-react";
import { PostCardSkeleton } from "@/components/feed/post-card-skeleton";
import { getUserRoleInCommunity, getCommunityByHandle } from "@/lib/community-utils";
import { type Post, type User } from "@/lib/types";
import Image from "next/image";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CommunityFeedPage() {
  const { user } = useAuth();
  const params = useParams();
  const handle = params.handle as string;
  
  const [posts, setPosts] = useState<(Post & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("guest");
  const [communityId, setCommunityId] = useState<string>("");
  const [filter, setFilter] = useState<string>("all");
  
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
        console.error("Error fetching community data:", error);
      }
    }
    
    fetchCommunityAndRole();
  }, [handle, user]);
  
  useEffect(() => {
    if (!handle || !communityId) {
      return;
    }
    
    const postsCollection = collection(db, "blogs");
    
    const constraints = [];
    constraints.push(where("communityHandle", "==", handle));
    
    if (!user) {
      constraints.push(where("visibility", "==", "public"));
    }
    
    constraints.push(orderBy("createdAt", "desc"));
    
    const q = query(postsCollection, ...constraints);
    
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const postsData: (Post & { id: string })[] = [];
      
      for (const postDoc of querySnapshot.docs) {
        const postData = postDoc.data() as Post;
        
        let authorData: User | null = null;
        if (postData.authorId) {
          try {
            const userRef = doc(db, "users", postData.authorId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              authorData = userSnap.data() as User;
            }
          } catch (error) {
            // If we can't fetch author, proceed without it
          }
        }
        
        postsData.push({
          id: postDoc.id,
          ...postData,
          author: authorData || { userId: "unknown", displayName: "Unknown User" },
          createdAt: postData.createdAt?.toDate(),
        });
      }
      
      // Filter posts based on visibility and user role
      const visiblePosts = user ? postsData : postsData.filter(p => p.visibility === "public");
      setPosts(visiblePosts);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching posts:", error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [handle, user, communityId]);
  
  const filteredPosts = posts.filter(post => {
    if (filter === "all") return true;
    if (filter === "images") return post.type === "image";
    if (filter === "text") return post.type === "text";
    return true;
  });
  
  return (
    <div className="container mx-auto max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Community Feed</h1>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Posts</SelectItem>
              <SelectItem value="images">Images</SelectItem>
              <SelectItem value="text">Text Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-6">
        {loading ? (
          <>
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </>
        ) : filteredPosts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <h2 className="text-xl font-semibold">No posts to display</h2>
              <p className="text-muted-foreground mt-2">
                {filter !== "all" 
                  ? `There are no ${filter} posts in this community yet.` 
                  : "There are no posts in this community yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPosts.map((post) => (
            <Card key={post.id}>
              <CardHeader className="flex flex-row items-center gap-4">
                <Avatar>
                  <AvatarImage src={post.author?.avatarUrl} />
                  <AvatarFallback>{post.author?.displayName?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold">{post.author?.displayName}</p>
                  <p className="text-sm text-muted-foreground">
                    {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ""}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                {post.title && <h2 className="text-xl font-semibold mb-2">{post.title}</h2>}
                {post.content.text && <p className="mb-4">{post.content.text}</p>}
                {post.content.mediaUrls?.[0] && (
                  <Image 
                    src={post.content.mediaUrls[0]} 
                    alt={post.title || "Post image"} 
                    width={600} 
                    height={400} 
                    className="rounded-md"
                  />
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
