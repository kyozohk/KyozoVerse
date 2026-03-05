'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Filter, Edit, Trash2 } from 'lucide-react';
import { FeedSkeletons } from '@/components/community/feed/skeletons';
import { getCommunityByHandle, getUserRoleInCommunity } from '@/lib/community-utils';
import { type Post, type User } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TextPostCardSimple } from '@/components/community/feed/text-post-card-simple';
import { AudioPostCard } from '@/components/community/feed/audio-post-card';
import { VideoPostCard } from '@/components/community/feed/video-post-card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CreatePostDialog } from '@/components/community/feed/create-post-dialog';
import Image from 'next/image';
import Link from 'next/link';
import { deletePost } from '@/lib/post-utils';

export default function FeedPage() {
  const params = useParams();
  const handle = params.handle as string;
  const { user } = useAuth();
  const { toast } = useToast();

  const [posts, setPosts] = useState<(Post & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [communityData, setCommunityData] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('guest');
  const [filter, setFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post & { id: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [postToEdit, setPostToEdit] = useState<Post & { id: string } | null>(null);

  // Fetch community data
  useEffect(() => {
    async function fetchCommunityData() {
      if (!handle) return;

      try {
        const data = await getCommunityByHandle(handle);
        if (data) {
          setCommunityData(data);
          
          // Check user role
          if (user) {
            const role = await getUserRoleInCommunity(user.uid, data.communityId);
            setUserRole(role);
          }
        }
      } catch (error) {
        console.error('Error fetching community data:', error);
      }
    }

    fetchCommunityData();
  }, [handle, user]);

  // Fetch posts
  useEffect(() => {
    if (!handle) {
      return;
    }

    const postsCollection = collection(db, 'blogs');

    const constraints = [
      where('communityHandle', '==', handle),
      orderBy('createdAt', 'desc')
    ];

    const q = query(postsCollection, ...constraints);

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const postsData: (Post & { id: string })[] = [];

      for (const postDoc of querySnapshot.docs) {
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
            // If we can't fetch author, proceed without it
          }
        }

        postsData.push({
          ...postData,
          id: postDoc.id,
          author: authorData || { userId: 'unknown', displayName: 'Unknown User' },
          createdAt: postData.createdAt?.toDate(),
        } as Post & { id: string });
      }
      
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching posts:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [handle, user, userRole]);

  const filteredPosts = posts.filter((post) => {
    // Filter by content type
    return filter === 'all' ? true :
      filter === 'images' ? post.type === 'image' :
      filter === 'text' ? post.type === 'text' :
      filter === 'audio' ? post.type === 'audio' :
      filter === 'video' ? post.type === 'video' : true;
  });

  const handleDeleteClick = (post: Post & { id: string }) => {
    setPostToDelete(post);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (post: Post & { id: string }) => {
    setPostToEdit(post);
    setShowEditDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete?.id) return;
    
    setIsDeleting(true);
    try {
      await deletePost(postToDelete.id, postToDelete.content.mediaUrls);
      toast({
        title: "Post deleted",
        description: "The post has been successfully deleted.",
      });
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          {communityData?.communityProfileImage && (
            <Image 
              src={communityData.communityProfileImage} 
              alt={communityData.name || handle} 
              width={40} 
              height={40} 
              className="rounded-full"
            />
          )}
          <h1 className="text-2xl font-bold text-gray-400">{communityData?.name || handle}</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-gray-700 text-white'
                : 'bg-transparent text-gray-600 hover:bg-gray-100'
            }`}
          >
            Feed
          </button>
          <button
            onClick={() => setFilter('text')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === 'text'
                ? 'bg-pink-100 text-pink-600'
                : 'bg-transparent text-gray-600 hover:bg-gray-100'
            }`}
          >
            Read
          </button>
          <button
            onClick={() => setFilter('audio')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === 'audio'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-transparent text-gray-600 hover:bg-gray-100'
            }`}
          >
            Listen
          </button>
          <button
            onClick={() => setFilter('video')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === 'video'
                ? 'bg-yellow-100 text-yellow-600'
                : 'bg-transparent text-gray-600 hover:bg-gray-100'
            }`}
          >
            Watch
          </button>
          <Link href={`/${handle}`}>
            <button className="px-4 py-1.5 rounded-full text-sm font-medium bg-transparent text-gray-600 hover:bg-gray-100 transition-colors">
              Profile
            </button>
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {loading ? (
          <FeedSkeletons />
        ) : filteredPosts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <h2 className="text-xl font-semibold">No posts to display</h2>
              <p className="text-muted-foreground mt-2">
                {filter !== 'all'
                  ? `There are no ${filter} posts in this community yet.`
                  : 'There are no posts in this community yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPosts.map((post) => {
            // Add edit handler for posts
            const postWithEditHandler = {
              ...post,
              _onEdit: () => handleEditClick(post),
            } as Post & { id: string; _onEdit?: () => void };
            
            switch (post.type) {
              case 'text':
              case 'image':
                return <TextPostCardSimple key={post.id} post={postWithEditHandler} />;
              case 'audio':
                return <AudioPostCard key={post.id} post={postWithEditHandler} />;
              case 'video':
                return <VideoPostCard key={post.id} post={postWithEditHandler} />;
              default:
                return null;
            }
          })
        )}
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the post
              "{postToDelete?.title}" and remove the data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      {postToEdit && (
        <CreatePostDialog
          isOpen={showEditDialog}
          setIsOpen={setShowEditDialog}
          postType={postToEdit.type as 'text' | 'image' | 'audio' | 'video'}
          communityId={postToEdit.communityId}
          communityHandle={postToEdit.communityHandle || ''}
          editPost={postToEdit}
        />
      )}
    </div>
  );
}
