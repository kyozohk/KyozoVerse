'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getCommunityByHandle, getUserRoleInCommunity } from '@/lib/community-utils';
import { Community, UserRole } from '@/lib/types';
import { CommunityHeader } from '@/components/community/community-header';
import { DeleteCommunityDialog } from '@/components/community/delete-community-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, Trash2, AlertTriangle } from 'lucide-react';
import { CustomButton } from '@/components/ui/CustomButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function CommunitySettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const handle = params.handle as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    const fetchCommunityData = async () => {
      if (!handle) return;
      setLoading(true);

      try {
        const communityData = await getCommunityByHandle(handle);
        setCommunity(communityData);

        if (communityData && user) {
          const role = await getUserRoleInCommunity(user.uid, communityData.communityId);
          setUserRole(role);
          
          // Check if user is super admin
          const isSuperAdmin = user.email === 'dev@kyozo.com' || user.email === 'admin@kyozo.com';
          
          // Only owners or super admins can access settings
          if (role !== 'owner' && !isSuperAdmin) {
            toast({
              title: "Access Denied",
              description: "Only community owners can access settings.",
              variant: "destructive",
            });
            router.push(`/${handle}`);
            return;
          }
        }
      } catch (error) {
        console.error('Error fetching community data:', error);
        toast({
          title: "Error",
          description: "Failed to load community data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityData();
  }, [handle, user, authLoading, router, toast]);

  const handleDeleteSuccess = () => {
    toast({
      title: "Community Deleted",
      description: "The community has been permanently deleted.",
    });
    router.push('/');
  };

  if (loading || authLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-40 w-full rounded-none" />
        <div className="px-4 md:px-8">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!community) {
    return <div className="p-8 text-center text-foreground">Community not found.</div>;
  }

  if (userRole !== 'owner') {
    return <div className="p-8 text-center text-foreground">Access denied.</div>;
  }

  // Check if user is super admin for enhanced permissions
  const isSuperAdmin = user?.email === 'dev@kyozo.com' || user?.email === 'admin@kyozo.com';

  return (
    <div className="space-y-8">
      <CommunityHeader 
        community={community} 
        userRole={userRole}
        memberCount={0}
      />
      
      <div className="px-4 md:px-8">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-6 w-6" style={{ color: '#5B4A3A' }} />
          <h1 className="text-2xl font-bold" style={{ color: '#5B4A3A' }}>Community Settings</h1>
        </div>

        {/* Danger Zone */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-white rounded-lg border border-red-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-1">Delete Community</h3>
                  <p className="text-sm text-red-700 mb-2">
                    Permanently delete "{community.name}" and all its data. This action cannot be undone.
                  </p>
                  {isSuperAdmin && (
                    <p className="text-xs text-orange-600 mb-2 font-medium">
                      🔐 Super Admin: You have permission to delete any community.
                    </p>
                  )}
                  <ul className="text-xs text-red-600 space-y-1">
                    <li>• All community posts and content</li>
                    <li>• All member associations</li>
                    <li>• Email domain ({community.handle}.kyozo.com)</li>
                    <li>• All community settings and data</li>
                  </ul>
                </div>
                <CustomButton
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="ml-4 border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400"
                  style={{ borderColor: '#FCA5A5', color: '#DC2626' }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Community
                </CustomButton>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional settings sections can be added here */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle style={{ color: '#5B4A3A' }}>Community Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium" style={{ color: '#6B5D52' }}>Community Name</label>
              <p className="mt-1 text-sm" style={{ color: '#5B4A3A' }}>{community.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium" style={{ color: '#6B5D52' }}>Handle</label>
              <p className="mt-1 text-sm" style={{ color: '#5B4A3A' }}>{community.handle}</p>
            </div>
            <div>
              <label className="text-sm font-medium" style={{ color: '#6B5D52' }}>Community ID</label>
              <p className="mt-1 text-sm font-mono" style={{ color: '#5B4A3A' }}>{community.communityId}</p>
            </div>
            {community.tagline && (
              <div>
                <label className="text-sm font-medium" style={{ color: '#6B5D52' }}>Tagline</label>
                <p className="mt-1 text-sm" style={{ color: '#5B4A3A' }}>{community.tagline}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DeleteCommunityDialog
        community={community}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
