
import { TextPostCardSkeleton } from './text-post-card-skeleton';
import { AudioPostCardSkeleton } from './audio-post-card-skeleton';
import { VideoPostCardSkeleton } from './video-post-card-skeleton';

export { TextPostCardSkeleton } from './text-post-card-skeleton';
export { AudioPostCardSkeleton } from './audio-post-card-skeleton';
export { VideoPostCardSkeleton } from './video-post-card-skeleton';
export { CreatePostDialogSkeleton } from './create-post-dialog-skeleton';

// Combined skeleton component that shows all types
export function FeedSkeletons() {
  return (
    <>
      <div className="break-inside-avoid mb-6">
        <TextPostCardSkeleton hasImage={true} />
      </div>
      <div className="break-inside-avoid mb-6">
        <AudioPostCardSkeleton />
      </div>
      <div className="break-inside-avoid mb-6">
        <VideoPostCardSkeleton />
      </div>
      <div className="break-inside-avoid mb-6">
        <TextPostCardSkeleton hasImage={false} />
      </div>
       <div className="break-inside-avoid mb-6">
        <AudioPostCardSkeleton />
      </div>
      <div className="break-inside-avoid mb-6">
        <TextPostCardSkeleton hasImage={false} />
      </div>
    </>
  );
}
