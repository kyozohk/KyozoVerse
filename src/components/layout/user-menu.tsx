
'use client';

import { useState, useEffect } from 'react';
import { LogOut, Loader2, ChevronsUpDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCommunityAuth } from '@/hooks/use-community-auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { type Community } from '@/lib/types';
import Link from 'next/link';

export function UserMenu() {
  const { user, loading, signOut } = useCommunityAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoadingCommunities(false);
      return;
    }

    const fetchCommunities = async () => {
      setLoadingCommunities(true);
      const memberQuery = query(collection(db, 'communityMembers'), where('userId', '==', user.uid));
      const memberSnap = await getDocs(memberQuery);
      const communityIds = memberSnap.docs.map(doc => doc.data().communityId);

      if (communityIds.length > 0) {
        const communitiesQuery = query(collection(db, 'communities'), where('communityId', 'in', communityIds));
        const communitiesSnap = await getDocs(communitiesQuery);
        const userCommunities = communitiesSnap.docs.map(doc => doc.data() as Community);
        setCommunities(userCommunities);
      }
      setLoadingCommunities(false);
    };

    fetchCommunities();
  }, [user]);

  if (loading) {
    return <Loader2 className="h-6 w-6 animate-spin" />;
  }

  if (!user) {
    return null;
  }

  const fallback = user.displayName?.charAt(0) || user.email?.charAt(0) || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
            <AvatarFallback>{fallback}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Your Communities</DropdownMenuLabel>
          {loadingCommunities ? (
            <DropdownMenuItem disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </DropdownMenuItem>
          ) : communities.length > 0 ? (
            communities.map(community => (
              <DropdownMenuItem key={community.communityId} asChild>
                <Link href={`/${community.handle}`}>
                  {community.name}
                </Link>
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled>No communities joined</DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
