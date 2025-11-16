'use client';

import { CommunityAuthProvider } from '@/hooks/use-community-auth';

export function CommunityAuthProviderWrapper({ children }: { children: React.ReactNode }) {
  return <CommunityAuthProvider>{children}</CommunityAuthProvider>;
}
