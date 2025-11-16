
'use client';

import React from 'react';
import { Users, MessageSquare, LineChart, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Community } from '@/lib/types';

interface CommunityStatsProps {
  community: Community;
}

export function CommunityStats({ community }: CommunityStatsProps) {
  // Mock data for now
  const stats = {
    totalMembers: community.memberCount || 0,
    communities: 0, // Placeholder
    monthlyGrowth: 0, // Placeholder
    dailyMessages: 0, // Placeholder
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-transparent border-gray-700/50 text-gray-400 hover:border-primary-purple">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Total Members</CardTitle>
          <Users className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{stats.totalMembers}</div>
          <p className="text-xs text-gray-400">+0 this month</p>
        </CardContent>
      </Card>
      <Card className="bg-transparent border-gray-700/50 text-gray-400 hover:border-primary-purple">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Posts</CardTitle>
          <MessageSquare className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{stats.communities}</div>
          <p className="text-xs text-gray-400">Total posts in community</p>
        </CardContent>
      </Card>
      <Card className="bg-transparent border-gray-700/50 text-gray-400 hover:border-primary-purple">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Monthly Growth</CardTitle>
          <LineChart className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">+{stats.monthlyGrowth}</div>
          <p className="text-xs text-gray-400">New members this month</p>
        </CardContent>
      </Card>
      <Card className="bg-transparent border-gray-700/50 text-gray-400 hover:border-primary-purple">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Daily Messages</CardTitle>
          <Mail className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{stats.dailyMessages}</div>
          <p className="text-xs text-gray-400">Messages sent today</p>
        </CardContent>
      </Card>
    </div>
  );
}
