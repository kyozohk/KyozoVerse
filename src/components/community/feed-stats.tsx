
'use client';

import React, { useEffect, useState } from 'react';
import { FileText, Mic, Video, TrendingUp, ThumbsUp, MessageSquare, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type Post } from '@/lib/types';

interface FeedStatsProps {
  posts: (Post & { id: string })[];
}

export function FeedStats({ posts }: FeedStatsProps) {
  const [stats, setStats] = useState({
    totalPosts: 0,
    textPosts: 0,
    audioPosts: 0,
    videoPosts: 0,
    todayPosts: 0,
    monthlyGrowth: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0
  });

  useEffect(() => {
    if (!posts || posts.length === 0) {
      setStats({
        totalPosts: 0,
        textPosts: 0,
        audioPosts: 0,
        videoPosts: 0,
        todayPosts: 0,
        monthlyGrowth: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
      });
      return;
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    let totalPosts = posts.length;
    let textPosts = 0;
    let audioPosts = 0;
    let videoPosts = 0;
    let todayPosts = 0;
    let thisMonthPosts = 0;
    let lastMonthPosts = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;

    posts.forEach(post => {
      // Count by type
      if (post.type === 'text' || post.type === 'image') {
        textPosts++;
      } else if (post.type === 'audio') {
        audioPosts++;
      } else if (post.type === 'video') {
        videoPosts++;
      }
      
      totalLikes += post.likes || 0;
      totalComments += post.comments || 0;
      totalShares += (post as any).shares || 0;

      // Count today's posts
      const postDate = post.createdAt?.toDate ? post.createdAt.toDate() : null;
      if (postDate) {
        if (postDate >= todayStart) {
          todayPosts++;
        }
        
        // Count this month's posts
        if (postDate >= monthStart) {
          thisMonthPosts++;
        }
        
        // Count last month's posts
        if (postDate >= lastMonthStart && postDate <= lastMonthEnd) {
          lastMonthPosts++;
        }
      }
    });

    // Calculate monthly growth
    const monthlyGrowth = thisMonthPosts - lastMonthPosts;

    setStats({
      totalPosts,
      textPosts,
      audioPosts,
      videoPosts,
      todayPosts,
      monthlyGrowth,
      totalLikes,
      totalComments,
      totalShares,
    });
  }, [posts]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {/* Total Posts */}
      <Card className="bg-white border-gray-200 hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Total Posts</CardTitle>
          <FileText className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{stats.totalPosts}</div>
          <p className="text-xs text-gray-500">
            {stats.todayPosts} posted today
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white border-pink-200 hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-pink-600">Total Likes</CardTitle>
          <ThumbsUp className="h-4 w-4 text-pink-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{stats.totalLikes}</div>
          <p className="text-xs text-gray-500">
            Across all posts
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white border-blue-200 hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-600">Total Comments</CardTitle>
          <MessageSquare className="h-4 w-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{stats.totalComments}</div>
           <p className="text-xs text-gray-500">
            Fostering engagement
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white border-yellow-200 hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-yellow-600">Total Shares</CardTitle>
          <Share2 className="h-4 w-4 text-yellow-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{stats.totalShares}</div>
           <p className="text-xs text-gray-500">
            Extending your reach
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
