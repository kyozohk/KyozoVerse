'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { type Community } from '@/lib/types';
import { SidebarNavItem } from '@/components/ui/sidebar-nav-item';
import { communityNavItems } from '@/lib/theme-utils';
import { CommunityImage } from '@/components/ui/community-image';

interface CommunitySidebarProps {
  handle: string;
}

export default function CommunitySidebar({ handle }: CommunitySidebarProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const communityQuery = query(collection(db, 'communities'), where('handle', '==', handle));
        const snapshot = await getDocs(communityQuery);
        if (!snapshot.empty) {
          setCommunity({ communityId: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Community);
        }
      } catch (error) {
        console.error('Error fetching community:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCommunity();
  }, [handle]);

  if (loading || !community) {
    return (
      <div className="hidden border-r lg:block w-64 sidebar transition-all duration-200 sidebar-shadow relative overflow-hidden" style={{ backgroundColor: 'hsl(var(--sidebar-background))' }}>
        <div className="p-4">Loading...</div>
      </div>
    );
  }

  return (
    <div className="hidden border-r lg:block w-64 sidebar transition-all duration-200 sidebar-shadow relative overflow-hidden" style={{ backgroundColor: 'hsl(var(--sidebar-background))' }}>
      <div className="flex flex-col h-full p-2">
        <div className="flex h-[80px] items-center justify-between border-b px-2 mb-4">
          <div className="flex items-center gap-2">
            {community.communityProfileImage && (
              <CommunityImage src={community.communityProfileImage} alt={community.name} width={32} height={32} containerClassName="rounded-full" />
            )}
            <h2 className="text-sm font-bold text-foreground truncate">{community.name}</h2>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {communityNavItems.map((item) => {
            const Icon = item.icon;
            const itemPath = item.href(handle);
            const isActive = pathname === itemPath;
            
            return (
              <SidebarNavItem
                key={item.label}
                href={itemPath}
                icon={<Icon className="h-4 w-4" />}
                isActive={isActive}
              >
                {item.label}
              </SidebarNavItem>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
