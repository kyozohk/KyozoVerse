import { PostCardSkeleton } from "@/components/feed/post-card-skeleton";

export default function DashboardPage() {
  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Your Feed</h1>
        <p className="text-muted-foreground">Catch up on what's happening in your communities.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <PostCardSkeleton />
        <PostCardSkeleton />
        <PostCardSkeleton />
        <PostCardSkeleton />
      </div>
    </div>
  );
}
