

'use client';

import React from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Globe,
  Users,
  Pencil,
  UserPlus,
  Mail,
  Bell,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CustomButton } from '@/components/ui/CustomButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Community, UserRole } from '@/lib/types';
import { getThemeForPath } from '@/lib/theme-utils';

interface CommunityHeaderProps {
  community: Community;
  userRole: UserRole;
  onEdit: () => void;
  onDelete?: () => void;
  onAddMember?: () => void;
}

export function CommunityHeader({ community, userRole, onEdit, onDelete, onAddMember }: CommunityHeaderProps) {
  const canManage = userRole === 'owner' || userRole === 'admin';
  const pathname = usePathname();
  const { activeBgColor } = getThemeForPath(pathname);

  return (
    <div className="relative p-6 md:p-8 text-white">
      {community.communityBackgroundImage && (
        <Image
          src={community.communityBackgroundImage}
          alt={`${community.name} banner`}
          layout="fill"
          objectFit="cover"
          className="absolute inset-0 z-0"
        />
      )}
      <div className="absolute inset-0 bg-black/50 z-0"></div>

      <div className="relative z-10">
        <div className="flex justify-between items-start">
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0 relative">
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: activeBgColor }}
                  />
                  <Avatar className="h-24 w-24 border-4 border-background/10 relative z-10">
                      <AvatarImage src={community.communityProfileImage} />
                      <AvatarFallback>{community.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>

                <div className="flex-grow">
                    <h1 className="text-3xl md:text-4xl font-bold text-white">{community.name}</h1>
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
            </div>

            {canManage && (
                <div className="flex gap-2">
                    <CustomButton variant="rounded-rect" size="small" className="text-white/80 hover:text-white hover:bg-white/10" onClick={onEdit}>
                        <Pencil className="h-4 w-4" />
                    </CustomButton>
                    {onDelete && (
                      <CustomButton 
                        variant="rounded-rect" 
                        size="small" 
                        className="text-white/80 hover:text-white hover:bg-white/10"
                        onClick={onDelete}
                        title="Delete community"
                      >
                        <Trash2 className="h-4 w-4" />
                      </CustomButton>
                    )}
                </div>
            )}
        </div>

        {canManage && (
            <div className="mt-4 flex flex-wrap items-start gap-2 md:gap-4 self-start md:self-center">
              {onAddMember && (
                <CustomButton 
                  variant="rounded-rect" 
                  className="text-white/80 hover:text-white hover:bg-white/10"
                  onClick={onAddMember}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Members
                </CustomButton>
              )}
              <CustomButton variant="rounded-rect" className="text-white/80 hover:text-white hover:bg-white/10">
                <Mail className="h-4 w-4 mr-2" />
                Invite
              </CustomButton>
              <CustomButton variant="rounded-rect" className="text-white/80 hover:text-white hover:bg-white/10">
                <Bell className="h-4 w-4 mr-2" />
                Broadcast
              </CustomButton>
            </div>
          )}
      </div>
    </div>
  );
}
