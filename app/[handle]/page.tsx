'use client';

import { useParams } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import the audience page content
const AudienceContent = dynamic(() => import('./audience/page').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ),
});

export default function CommunityPage() {
  return <AudienceContent />;
}
