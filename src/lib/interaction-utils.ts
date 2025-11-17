import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface RecordInteractionParams {
  userId: string;
  postId: string;
  communityId: string;
  interactionType: 'play' | 'like' | 'view' | 'finish';
  mediaType: 'audio' | 'video';
  playDurationSeconds?: number;
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
      // Optional: Emit a permission error if you have security rules on this collection
      // This is useful for debugging rules related to interaction logging.
      errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: '/userInteractions',
          operation: 'create',
          requestResourceData: interactionData,
      }));
    });
}
