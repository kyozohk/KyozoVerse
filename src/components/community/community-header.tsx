
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Globe,
  Users,
  Pencil,
  UserPlus,
  Mail,
  Trash2,
  Crown,
  Megaphone,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CustomButton } from '@/components/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Community, UserRole } from '@/lib/types';
import { getThemeForPath } from '@/lib/theme-utils';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';

interface CommunityHeaderProps {
  community: Community;
  userRole: UserRole;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddMember?: () => void;
  onInvite?: () => void;
  memberCount?: number; // Actual member count excluding owner
  customActions?: React.ReactNode; // Custom action buttons for specific routes
}

export function CommunityHeader({ community, userRole, onEdit, onDelete, onAddMember, onInvite, memberCount, customActions }: CommunityHeaderProps) {
  const canManage = userRole === 'owner' || userRole === 'admin';
  const pathname = usePathname();
  const { activeBgColor } = getThemeForPath(pathname);
  const [ownerInfo, setOwnerInfo] = useState<{ displayName: string; email: string; avatarUrl?: string } | null>(null);

  useEffect(() => {
    const fetchOwnerInfo = async () => {
      if (community.ownerId) {
        try {
          const ownerDoc = await getDoc(doc(db, 'users', community.ownerId));
          if (ownerDoc.exists()) {
            const ownerData = ownerDoc.data();
            setOwnerInfo({
              displayName: ownerData.displayName || 'Unknown',
              email: ownerData.email || '',
              avatarUrl: ownerData.avatarUrl || '',
            });
          }
        } catch (error) {
          console.error('Error fetching owner info:', error);
        }
      }
    };
    fetchOwnerInfo();
  }, [community.ownerId]);

  return (
    <div className="relative p-6 md:p-8 text-white">
      {community.communityBackgroundImage && (
        <Image
          src={community.communityBackgroundImage}
          alt={`${community.name} banner`}
          fill
          className="object-cover absolute inset-0 z-0"
          priority
        />
      )}
      <div className="absolute inset-0 bg-black/50 z-0"></div>

      <div className="relative z-10 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start">
            {/* Owner Info - Top Right */}
            {ownerInfo && (
              <div className="absolute top-0 right-0 flex items-center gap-3 bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2">
                <Avatar className="h-10 w-10 border-2 border-white/20">
                  <AvatarImage src={ownerInfo.avatarUrl} />
                  <AvatarFallback>{ownerInfo.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <Crown className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm font-semibold text-white">{ownerInfo.displayName}</span>
                  </div>
                  <span className="text-xs text-white/60">{ownerInfo.email}</span>
                </div>
              </div>
            )}
            
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
                        {community.isPrivate ? 'Private' : 'Public'}
                        </Badge>
                        <Badge variant="secondary" className="bg-white/10 text-white/90 border-0">
                        <Users className="h-3 w-3 mr-1.5" />
                        {memberCount !== undefined ? memberCount : community.memberCount || 0} members
                        </Badge>
                    </div>
                </div>
            </div>
        </div>

        {canManage && (
            <div className="mt-4 flex items-center gap-2 md:gap-4 w-full">
              {customActions ? (
                <div className="flex items-center gap-2 md:gap-4 w-full">
                  {customActions}
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2 md:gap-4">
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
                    <CustomButton 
                      variant="rounded-rect" 
                      className="text-white/80 hover:text-white hover:bg-white/10"
                      onClick={onInvite}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Invite
                    </CustomButton>
                    <CustomButton variant="rounded-rect" className="text-white/80 hover:text-white hover:bg-white/10">
                      <Megaphone className="h-4 w-4 mr-2" />
                      Broadcast
                    </CustomButton>
                  </div>
                  
                  {/* Only show edit/delete on overview page */}
                  {pathname.split('/').filter(Boolean).length === 1 && (
                    <div className="flex items-center gap-2 ml-auto">
                      <CustomButton variant="rounded-rect" size="small" className="text-white/80 hover:text-white hover:bg-white/10" onClick={onEdit}>
                          <Pencil className="h-4 w-4" />
                      </CustomButton>
                      {onDelete && (
                        <CustomButton 
                          variant="rounded-rect" 
                          size="small" 
                          className="text-white/80 hover:text-red-400 hover:bg-white/10"
                          onClick={onDelete}
                          title="Delete community"
                        >
                          <Trash2 className="h-4 w-4" />
                        </CustomButton>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
      </div>
    </div>
  );
}
