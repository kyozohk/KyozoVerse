'use client';

import { useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';

export default function JoinCommunityPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const handle = params.handle as string;

  // Redirect to main feed page with signup params
  useEffect(() => {
    const urlParams = new URLSearchParams();
    urlParams.set('signup', 'true');
    
    // Preserve all URL params
    searchParams.forEach((value, key) => {
      urlParams.set(key, value);
    });
    
    router.replace(`/${handle}?${urlParams.toString()}`);
  }, [handle, searchParams, router]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-100">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/bg/light_app_bg.png)' }}
      />
      
      {/* Loading content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-200">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-300 border-t-purple-600 mb-4"></div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900">
              Loading...
            </h2>
            <p className="text-gray-600">
              Preparing your signup experience
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
