'use client';

import { useEffect, useState } from 'react';
import { BarChart3, LineChart, Users, MessageSquare, TrendingUp, Activity } from 'lucide-react';
import { collection, query, where, getDocs, getCountFromServer } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';

interface CommunityStats {
  name: string;
  handle: string;
  memberCount: number;
  postCount: number;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<CommunityStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ communities: 0, members: 0, posts: 0 });

  useEffect(() => {
    if (!user) return;

    const fetchAnalytics = async () => {
      try {
        // Fetch all communities owned by this user
        const communitiesQuery = query(
          collection(db, 'communities'),
          where('ownerId', '==', user.uid)
        );
        const communitiesSnap = await getDocs(communitiesQuery);

        const communityStats: CommunityStats[] = [];
        let totalMembers = 0;
        let totalPosts = 0;

        for (const doc of communitiesSnap.docs) {
          const data = doc.data();
          const communityId = doc.id;

          // Count members
          const membersQuery = query(
            collection(db, 'communityMembers'),
            where('communityId', '==', communityId)
          );
          const membersCount = await getCountFromServer(membersQuery);
          const memberCount = membersCount.data().count;

          // Count posts
          let postCount = 0;
          try {
            const postsQuery = query(
              collection(db, 'blogs'),
              where('communityHandle', '==', data.handle)
            );
            const postsCount = await getCountFromServer(postsQuery);
            postCount = postsCount.data().count;
          } catch {
            // blogs collection might not have the index
          }

          communityStats.push({
            name: data.name,
            handle: data.handle,
            memberCount,
            postCount,
          });

          totalMembers += memberCount;
          totalPosts += postCount;
        }

        setStats(communityStats);
        setTotals({
          communities: communitiesSnap.size,
          members: totalMembers,
          posts: totalPosts,
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user]);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#699FE5] to-[#8FB8F0] text-white p-6 md:p-8 rounded-xl shadow-lg mb-8">
        <div className="flex items-center mb-2">
          <BarChart3 className="h-6 w-6 mr-2" />
          <h2 className="text-2xl md:text-3xl font-bold">Analytics Dashboard</h2>
        </div>
        <div className="flex items-center text-white/90 mb-4 bg-white/10 px-3 py-1 rounded-full w-fit">
          <LineChart className="h-5 w-5 mr-2" />
          <span>View your community metrics</span>
        </div>
        <p className="text-white/90 max-w-md backdrop-blur-sm bg-black/5 p-3 rounded-lg">
          Track growth, engagement, and performance metrics for your communities.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Communities</p>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold" style={{ color: '#5B4A3A' }}>
            {loading ? '...' : totals.communities}
          </p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Members</p>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold" style={{ color: '#5B4A3A' }}>
            {loading ? '...' : totals.members}
          </p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Posts</p>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold" style={{ color: '#5B4A3A' }}>
            {loading ? '...' : totals.posts}
          </p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Avg Members/Community</p>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold" style={{ color: '#5B4A3A' }}>
            {loading ? '...' : totals.communities > 0 ? Math.round(totals.members / totals.communities) : 0}
          </p>
        </Card>
      </div>

      {/* Per-Community Breakdown */}
      <h3 className="text-xl font-semibold mb-4" style={{ color: '#5B4A3A' }}>Community Breakdown</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-5 bg-muted rounded w-3/4 mb-4" />
              <div className="h-8 bg-muted rounded w-1/2 mb-2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </Card>
          ))
        ) : stats.length === 0 ? (
          <Card className="p-6 col-span-full text-center">
            <p className="text-muted-foreground">No communities found. Create your first community to see analytics.</p>
          </Card>
        ) : (
          stats.map((community) => (
            <Card key={community.handle} className="p-6 hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-lg mb-3" style={{ color: '#5B4A3A' }}>{community.name}</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" /> Members
                  </span>
                  <span className="font-semibold" style={{ color: '#5B4A3A' }}>{community.memberCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" /> Posts
                  </span>
                  <span className="font-semibold" style={{ color: '#5B4A3A' }}>{community.postCount}</span>
                </div>
                {/* Progress bar for member count */}
                <div className="mt-2">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (community.memberCount / Math.max(totals.members, 1)) * 100)}%`,
                        backgroundColor: '#D4A574',
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
