
'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function CommunityHandleRedirect() {
  const router = useRouter();
  const params = useParams();
  const handle = params.handle as string;
  
  useEffect(() => {
    if (handle) {
      router.replace(`/c/${handle}/feed`);
    }
  }, [router, handle]);

  return null;
}
