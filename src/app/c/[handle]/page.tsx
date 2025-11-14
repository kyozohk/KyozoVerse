'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCommunityByHandle } from '@/lib/community-utils';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CommunityPublicPage() {
  const params = useParams();
  const router = useRouter();
  const handle = params.handle as string;
  const [communityData, setCommunityData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCommunityData() {
      if (!handle) return;

      try {
        const data = await getCommunityByHandle(handle);
        if (data) {
          setCommunityData(data);
          setLoading(false);
        } else {
          // Community not found
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching community data:', error);
        setLoading(false);
      }
    }

    fetchCommunityData();
  }, [handle]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!communityData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Community Not Found</h1>
        <p className="text-gray-600 mb-6">The community you're looking for doesn't exist or is private.</p>
        <Button onClick={() => router.push('/landing')}>Return Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero section */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-1/2">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{communityData.name}</h1>
              <p className="text-gray-600 mb-6">{communityData.description || 'Welcome to our community!'}</p>
              <div className="flex gap-4">
              </div>
            </div>
            <div className="w-full md:w-1/2 flex justify-center">
              {communityData.communityProfileImage ? (
                <Image 
                  src={communityData.communityProfileImage} 
                  alt={communityData.name} 
                  width={300} 
                  height={300} 
                  className="rounded-lg shadow-lg"
                />
              ) : (
                <div className="w-[300px] h-[300px] bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-4xl font-bold text-gray-400">
                    {communityData.name?.substring(0, 2) || 'C'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content sections */}
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">About {communityData.name}</h2>
            <p className="text-gray-600">
              {communityData.description || 'This community is a place for like-minded individuals to connect and share ideas.'}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Latest Updates</h2>
            <div className="space-y-4">
              <Link href={`/c/${handle}/feed`} className="block hover:bg-gray-50 p-2 rounded">
                <h3 className="font-medium">Check out our community feed</h3>
                <p className="text-sm text-gray-500">See the latest posts from our community members</p>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Call to action */}
      <div className="bg-primary/10 py-12">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to join {communityData.name}?</h2>
          <p className="text-gray-600 mb-6">Become a member and start engaging with our community today.</p>
          <Button size="lg" asChild>
            <Link href="/">Join Now</Link>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t py-6 mt-12">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} {communityData.name}
            </p>
            <div className="flex gap-4">
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
                Terms
              </Link>
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
