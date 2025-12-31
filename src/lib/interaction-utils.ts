
import { collection, addDoc, serverTimestamp, doc, runTransaction, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { type Post } from './types';

interface RecordInteractionParams {
  userId: string;
  postId: string;
  communityId: string;
  interactionType: 'play' | 'like' | 'view' | 'finish' | 'comment' | 'share';
  mediaType: 'audio' | 'video' | 'text' | 'image';
  playDurationSeconds?: number;
  commentText?: string;
}

/**
 * Records a user's interaction with a piece of content.
 */
export function recordInteraction(params: RecordInteractionParams) {
  const interactionData = {
    ...params,
    timestamp: serverTimestamp(),
  };

  addDoc(collection(db, 'userInteractions'), interactionData)
    .catch((error) => {
      console.error('Error recording interaction:', error);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: '/userInteractions',
          operation: 'create',
          requestResourceData: interactionData,
      }));
    });
}

/**
 * Toggles a like on a post.
 */
export async function toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
    const postRef = doc(db, 'blogs', postId);
    const likeRef = doc(db, 'blogs', postId, 'likes', userId);
  
    try {
      const { liked, likesCount } = await runTransaction(db, async (transaction) => {
        const postDoc = await transaction.get(postRef);
        const likeDoc = await transaction.get(likeRef);
  
        if (!postDoc.exists()) {
          throw "Post does not exist!";
        }
  
        const postData = postDoc.data() as Post;
        let currentLikes = postData.likes || 0;
        let newLikedState = false;
  
        if (likeDoc.exists()) {
          // User has already liked, so unlike
          transaction.delete(likeRef);
          currentLikes = Math.max(0, currentLikes - 1);
          newLikedState = false;
        } else {
          // User has not liked, so like
          transaction.set(likeRef, { userId, createdAt: serverTimestamp() });
          currentLikes += 1;
          newLikedState = true;
        }
  
        transaction.update(postRef, { likes: currentLikes });
  
        return { liked: newLikedState, likesCount: currentLikes };
      });

      return { liked, likesCount };
      
    } catch (error) {
      console.error("Error toggling like: ", error);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `/blogs/${postId}/likes/${userId}`,
          operation: 'write'
      }));
      throw error;
    }
}
