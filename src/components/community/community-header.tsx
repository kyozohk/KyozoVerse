'use client';

import React from 'react';
import Image from 'next/image';
import {
  Globe,
  Users,
  Pencil,
  UserPlus,
  Mail,
  Bell,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Community, UserRole } from '@/lib/types';

interface CommunityHeaderProps {
  community: Community;
  userRole: UserRole;
}

export function CommunityHeader({ community, userRole }: CommunityHeaderProps) {
  const canManage = userRole === 'owner' || userRole === 'admin';

  return (
    <div className="relative rounded-xl overflow-hidden p-6 md:p-8 text-white bg-gray-800/80 backdrop-blur-sm border border-gray-700/80">
      {community.communityBackgroundImage && (
        <Image
          src={community.communityBackgroundImage}
          alt={`${community.name} banner`}
          layout="fill"
          objectFit="cover"
          className="absolute inset-0 z-0 opacity-10"
        />
      )}

      <div className="relative z-10 flex flex-col md:flex-row gap-6">
        <div className="flex-shrink-0">
          <Avatar className="h-24 w-24 border-4 border-background/10">
            <AvatarImage src={community.communityProfileImage} />
            <AvatarFallback>{community.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-grow">
          <h1 className="text-3xl md:text-4xl font-bold">{community.name}</h1>
          <p className="text-lg text-white/70 mt-1">{community.tagline}</p>

          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="secondary" className="bg-white/10 text-white/90 border-0">
              <Globe className="h-3 w-3 mr-1.5" />
              {community.communityPrivacy || 'Public'}
            </Badge>
            <Badge variant="secondary" className="bg-white/10 text-white/90 border-0">
              <Users className="h-3 w-3 mr-1.5" />
              {community.memberCount || 0} members
            </Badge>
          </div>
        </div>

        {canManage && (
            <div className="flex flex-wrap items-start gap-2 md:gap-4 self-start md:self-center">
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
                <Pencil className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Members
              </Button>
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
                <Mail className="h-4 w-4 mr-2" />
                Invite
              </Button>
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
                <Bell className="h-4 w-4 mr-2" />
                Broadcast
              </Button>
            </div>
          )}
      </div>
    </div>
  );
}
