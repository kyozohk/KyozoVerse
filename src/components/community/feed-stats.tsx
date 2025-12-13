'use client';

import React, { useEffect, useState } from 'react';
import { FileText, Mic, Video, TrendingUp } from 'lucide-react';
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

    posts.forEach(post => {
      // Count by type
      if (post.type === 'text' || post.type === 'image') {
        textPosts++;
      } else if (post.type === 'audio') {
        audioPosts++;
      } else if (post.type === 'video') {
        videoPosts++;
      }

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

      {/* Text Posts */}
      <Card className="bg-white border-pink-200 hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-pink-600">Text Posts</CardTitle>
          <div className="px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-xs font-medium">
            Read
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{stats.textPosts}</div>
          <p className="text-xs text-gray-500">
            {stats.totalPosts > 0 ? Math.round((stats.textPosts / stats.totalPosts) * 100) : 0}% of total
          </p>
        </CardContent>
      </Card>

      {/* Audio Posts */}
      <Card className="bg-white border-blue-200 hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-600">Audio Posts</CardTitle>
          <div className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
            Listen
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{stats.audioPosts}</div>
          <p className="text-xs text-gray-500">
            {stats.totalPosts > 0 ? Math.round((stats.audioPosts / stats.totalPosts) * 100) : 0}% of total
          </p>
        </CardContent>
      </Card>

      {/* Video Posts */}
      <Card className="bg-white border-yellow-200 hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-yellow-600">Video Posts</CardTitle>
          <div className="px-3 py-1 bg-yellow-100 text-yellow-600 rounded-full text-xs font-medium">
            Watch
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{stats.videoPosts}</div>
          <p className="text-xs text-gray-500">
            {stats.totalPosts > 0 ? Math.round((stats.videoPosts / stats.totalPosts) * 100) : 0}% of total
          </p>
        </CardContent>
      </Card>

      {/* Monthly Growth - Full Width */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 hover:shadow-md transition-shadow md:col-span-2 lg:col-span-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-purple-700">Monthly Growth</CardTitle>
          <TrendingUp className={`h-4 w-4 ${stats.monthlyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`} />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <div className={`text-2xl font-bold ${stats.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.monthlyGrowth >= 0 ? '+' : ''}{stats.monthlyGrowth}
            </div>
            <p className="text-xs text-gray-600">
              posts this month compared to last month
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
