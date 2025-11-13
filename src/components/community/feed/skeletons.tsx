export { TextPostCardSkeleton } from './text-post-card-skeleton';
export { AudioPostCardSkeleton } from './audio-post-card-skeleton';
export { VideoPostCardSkeleton } from './video-post-card-skeleton';
export { CreatePostDialogSkeleton } from './create-post-dialog-skeleton';

// Combined skeleton component that shows all types
import { TextPostCardSkeleton } from './text-post-card-skeleton';
import { AudioPostCardSkeleton } from './audio-post-card-skeleton';
import { VideoPostCardSkeleton } from './video-post-card-skeleton';
import { CreatePostDialogSkeleton } from './create-post-dialog-skeleton';

export function FeedSkeletons() {
  return (
    <div className="space-y-6">
      <TextPostCardSkeleton hasImage={true} />
      <AudioPostCardSkeleton />
      <VideoPostCardSkeleton />
    </div>
  );
}
