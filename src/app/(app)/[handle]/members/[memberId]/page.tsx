
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { User, CommunityMember } from '@/lib/types';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage, Button, Card, CardContent, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger, Skeleton } from '@/components/ui';
import { Mail, Phone, Edit, Trash2, MessageCircle, Users, Heart, Eye } from 'lucide-react';

export default function MemberProfilePage() {
  const params = useParams();
  const { handle, memberId } = params as { handle: string, memberId: string };
  
  const [member, setMember] = useState<(User & { role?: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (memberId) {
      const fetchMember = async () => {
        try {
          const userDocRef = doc(db, 'users', memberId);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            // In a real app, you would also fetch their role for this specific community
            setMember({ ...userSnap.data(), role: 'Member' } as User & { role?: string });
          } else {
            console.log('No such user!');
          }
        } catch (error) {
          console.error("Error fetching member data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchMember();
    }
  }, [memberId]);

  if (loading) {
    return (
      <div className="space-y-4 p-8">
        <Skeleton className="h-48 w-full" />
        <div className="flex items-end -mt-16 ml-8">
          <Skeleton className="h-24 w-24 rounded-full border-4 border-background" />
        </div>
        <Skeleton className="h-8 w-1/4 mt-4 ml-8" />
        <Skeleton className="h-4 w-1/2 ml-8" />
        <div className="p-8">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!member) {
    return <div className="p-8 text-center">Member not found.</div>;
  }

  return (
    <div className="flex-1">
      {/* Banner */}
      <div className="relative h-48 w-full bg-slate-200">
        {member.coverUrl ? (
          <Image src={member.coverUrl} alt={`${member.displayName}'s cover image`} layout="fill" objectFit="cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-500 to-gray-400" />
        )}
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute top-4 right-4 flex gap-2">
            <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10">
                <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10">
                <MessageCircle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300 hover:bg-white/10">
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
      </div>
      
      {/* Profile Header */}
      <div className="px-8 -mt-12">
        <div className="flex items-end">
            <Avatar className="h-24 w-24 border-4 border-background">
                <AvatarImage src={member.avatarUrl} />
                <AvatarFallback>{member.displayName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="ml-4 mb-2">
                <h1 className="text-2xl font-bold">{member.displayName}</h1>
                <p className="text-sm text-muted-foreground">{member.role}</p>
            </div>
        </div>
        <p className="mt-2 text-muted-foreground max-w-2xl">{member.bio || 'No bio available.'}</p>
        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1"><Mail className="h-4 w-4" /> {member.email}</div>
            <div className="flex items-center gap-1"><Phone className="h-4 w-4" /> {member.phone || 'No phone number'}</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        <Tabs defaultValue="activity">
          <TabsList>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="communities">Communities</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground py-12">
                <Heart className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Activity feed coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="communities">
             <Card>
              <CardHeader>
                <CardTitle>Member Of</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground py-12">
                <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Community list coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="messages">
             <Card>
              <CardHeader>
                <CardTitle>Messages</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground py-12">
                <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Messaging history coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
