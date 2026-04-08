'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Community } from '@/lib/types';
import { Globe, Lock, Settings, Bell, Shield, Palette, Trash2, AlertTriangle } from 'lucide-react';
import { Banner } from '@/components/ui/banner';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLoadingSkeleton } from '@/components/community/page-loading-skeleton';
import { useToast } from '@/hooks/use-toast';
import { DeleteCommunityDialog } from '@/components/community/delete-community-dialog';
import { CustomButton } from '@/components/ui/CustomButton';
import { useAuth } from '@/hooks/use-auth';
import { getUserRoleInCommunity } from '@/lib/community-utils';

export default function SettingsPage() {
  const params = useParams();
  const router = useRouter();
  const handle = params.handle as string;
  const { user, loading: authLoading } = useAuth();
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'member' | 'guest'>('guest');
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;

    const fetchCommunity = async () => {
      try {
        const communitiesRef = collection(db, 'communities');
        const q = query(communitiesRef, where('handle', '==', handle));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const communityData = { communityId: doc.id, ...doc.data() } as Community;
          setCommunity(communityData);

          // Get user role if user is logged in
          if (user) {
            const role = await getUserRoleInCommunity(user.uid, communityData.communityId);
            setUserRole(role);
          }
        }
      } catch (error) {
        console.error('Error fetching community:', error);
        toast({
          title: "Error",
          description: "Failed to load community data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (handle) {
      fetchCommunity();
    }
  }, [handle, user, authLoading, toast]);

  const handleDeleteSuccess = () => {
    toast({
      title: "Community Deleted",
      description: "The community has been permanently deleted.",
    });
    router.push('/');
  };

  if (loading || authLoading) {
    return <PageLoadingSkeleton showMemberList={true} />;
  }

  if (!community) {
    return (
      <div 
        className="h-screen flex flex-col items-center justify-center p-8" 
        style={{ backgroundColor: 'var(--page-bg-color)' }}
      >
        <div 
          className="rounded-2xl p-8 text-center max-w-md" 
          style={{ 
            backgroundColor: 'var(--page-content-bg)', 
            border: '2px solid var(--page-content-border)' 
          }}
        >
          <h2 className="text-xl font-semibold mb-2" style={{ color: '#5B4A3A' }}>
            Community not found
          </h2>
          <p className="text-sm" style={{ color: '#8B7355' }}>
            The community you're looking for doesn't exist or you don't have access.
          </p>
        </div>
      </div>
    );
  }

  const settingsSections = [
    { icon: Settings, title: 'General', description: 'Basic community settings' },
    { icon: Bell, title: 'Notifications', description: 'Manage notification preferences' },
    { icon: Shield, title: 'Privacy', description: 'Privacy and security settings' },
    { icon: Palette, title: 'Appearance', description: 'Customize look and feel' },
  ];

  return (
    <div 
      className="min-h-screen flex flex-col" 
      style={{ backgroundColor: 'var(--page-bg-color)' }}
    >
      <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-auto">
        <div 
          className="rounded-2xl overflow-hidden mx-auto max-w-7xl" 
          style={{ 
            backgroundColor: 'var(--page-content-bg)', 
            border: '2px solid var(--page-content-border)' 
          }}
        >
          {community && (
            <Banner
              backgroundImage={community.communityBackgroundImage}
              iconImage={community.communityProfileImage}
              title={community.name}
              location={community.location ?? ''}
              locationExtra={
                <span className="flex items-center gap-1 text-sm text-white/90">
                  {community.visibility === 'private' ? (
                    <>
                      <Lock className="h-3.5 w-3.5" /> Private
                    </>
                  ) : (
                    <>
                      <Globe className="h-3.5 w-3.5" /> Public
                    </>
                  )}
                </span>
              }
              subtitle={community.tagline || community.mantras || ''}
              height="16rem"
            />
          )}
          
          <div className="p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold mb-2" style={{ color: '#5B4A3A' }}>
                  Settings
                </h2>
                <p className="text-lg" style={{ color: '#8B7355' }}>
                  Manage your community settings
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
              {settingsSections.map((section, index) => (
                <Card
                  key={index}
                  className="group flex flex-col p-6 h-48 lg:h-52 cursor-pointer hover:bg-accent/50 transition-all duration-200 shadow-lg hover:shadow-xl border hover:border-primary/30"
                  style={{
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--card-border)'
                  }}
                  onClick={() =>
                    toast({
                      title: `${section.title} Settings`,
                      description: `${section.title} settings coming soon!`,
                      duration: 3000
                    })
                  }
                >
                  <div className="text-center flex-1 flex flex-col items-center justify-center" style={{ color: '#8B7355' }}>
                    <section.icon className="mx-auto h-12 w-12 lg:h-14 lg:w-14 mb-3 group-hover:scale-110 transition-transform duration-200" />
                    <h3 className="font-semibold text-base lg:text-lg mb-1">{section.title}</h3>
                    <p className="text-xs lg:text-sm opacity-80">{section.description}</p>
                  </div>

                  <div className="flex justify-center pt-2">
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        color: '#8B7355',
                        borderColor: '#D8CFC0'
                      }}
                    >
                      Coming Soon
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>

            {/* Danger Zone - Only show for owners */}
            {userRole === 'owner' && (
              <div className="mt-8">
                <Card className="border-red-200 bg-red-50">
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="h-5 w-5 text-red-900" />
                      <h3 className="text-lg font-semibold text-red-900">Danger Zone</h3>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-red-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-red-900 mb-1">Delete Community</h4>
                          <p className="text-sm text-red-700 mb-2">
                            Permanently delete "{community?.name}" and all its data. This action cannot be undone.
                          </p>
                          <ul className="text-xs text-red-600 space-y-1">
                            <li>• All community posts and content</li>
                            <li>• All member associations</li>
                            <li>• Email domain ({community?.handle}.kyozo.com)</li>
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
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {community && (
        <DeleteCommunityDialog
          community={community}
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
}
