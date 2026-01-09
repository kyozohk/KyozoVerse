
'use client';

import React, { useEffect, useState } from 'react';
import { Users, LayoutGrid, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type Community } from '@/lib/types';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase/firestore';

interface CommunitiesDashboardStatsProps {
  communities: Community[];
}

export function CommunitiesDashboardStats({ communities }: CommunitiesDashboardStatsProps) {
  const [totalPosts, setTotalPosts] = useState(0);

  useEffect(() => {
    const fetchPosts = async () => {
      if (communities.length === 0) {
        setTotalPosts(0);
        return;
      }

      const communityIds = communities.map(c => c.communityId);
      const postsQuery = query(collection(db, 'blogs'), where('communityId', 'in', communityIds));
      const postsSnapshot = await getDocs(postsQuery);
      setTotalPosts(postsSnapshot.size);
    };

    fetchPosts();
  }, [communities]);

  const totalMembers = communities.reduce((sum, community) => sum + (community.memberCount || 0), 0);

  return (
    <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="bg-card border-gray-200/80 hover:border-purple-300 transition-colors border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Communities</CardTitle>
          <LayoutGrid className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{communities.length}</div>
          <p className="text-xs text-muted-foreground">You are a part of</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-gray-200/80 hover:border-purple-300 transition-colors border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{totalMembers}</div>
          <p className="text-xs text-muted-foreground">Across all your communities</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-gray-200/80 hover:border-purple-300 transition-colors border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Posts</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{totalPosts}</div>
          <p className="text-xs text-muted-foreground">Across all your communities</p>
        </CardContent>
      </Card>
    </div>
  );
}
