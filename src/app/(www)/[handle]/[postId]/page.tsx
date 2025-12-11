
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Post, User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function FullPostPage() {
  const params = useParams();
  const { handle, postId } = params;

  const [post, setPost] = useState<(Post & { id: string }) | null>(null);
  const [author, setAuthor] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;

    const fetchPost = async () => {
      setLoading(true);
      try {
        const postRef = doc(db, 'blogs', postId as string);
        const postSnap = await getDoc(postRef);

        if (postSnap.exists()) {
          const postData = { id: postSnap.id, ...postSnap.data() } as Post & { id: string };
          setPost(postData);

          if (postData.authorId) {
            const authorRef = doc(db, 'users', postData.authorId);
            const authorSnap = await getDoc(authorRef);
            if (authorSnap.exists()) {
              setAuthor(authorSnap.data() as User);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching post:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-3xl p-8 space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-12 w-3/4" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="aspect-video w-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!post) {
    return <div className="text-center p-8">Post not found.</div>;
  }

  const postDate = post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="container mx-auto max-w-3xl p-4 md:p-8">
        <article>
          <header className="mb-8">
            <Link href={`/${handle}`} className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to feed
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 leading-tight mb-4">{post.title}</h1>
            <div className="flex items-center gap-4 text-neutral-500">
              {author && (
                <div className="flex items-center gap-2">
                  <Image src={author.avatarUrl || `https://i.pravatar.cc/150?u=${author.userId}`} alt={author.displayName || 'author'} width={40} height={40} className="rounded-full" />
                  <span className="font-medium">{author.displayName}</span>
                </div>
              )}
              {postDate && <span>•</span>}
              <span>{postDate}</span>
            </div>
          </header>

          {post.content.mediaUrls && post.content.mediaUrls.length > 0 && (
            <div className="mb-8 rounded-lg overflow-hidden aspect-video relative">
              <Image src={post.content.mediaUrls[0]} alt={post.title || ''} fill className="object-cover" />
            </div>
          )}

          <div className="prose prose-lg max-w-none text-slate-700">
            <p>{post.content.text}</p>
          </div>
        </article>
      </div>
    </div>
  );
}
