'use client';

import { useState } from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Palette } from 'lucide-react';
import { Header } from '@/components/ui/header';
import { CustomButton } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';

export default function SettingsPage() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-gradient-to-r from-[#06C4B5] to-[#4DDFD3] text-white p-6 md:p-8 rounded-xl shadow-lg mb-8">
        <div className="flex items-center mb-2">
          <SettingsIcon className="h-6 w-6 mr-2" />
          <h2 className="text-2xl md:text-3xl font-bold">Account Settings</h2>
        </div>
        
        <div className="flex items-center text-white/90 mb-4 bg-white/10 px-3 py-1 rounded-full w-fit">
          <User className="h-5 w-5 mr-2" />
          <span>Manage your account preferences</span>
        </div>
        
        <p className="text-white/90 max-w-md backdrop-blur-sm bg-black/5 p-3 rounded-lg">
          Update your profile, notification preferences, and security settings.
        </p>
      </div>

      <Header title="Settings" />
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6">
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-medium mb-4">Profile Information</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Display Name" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)} 
                />
                <Input 
                  label="Email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  disabled
                />
              </div>
              
              <div className="flex justify-end">
                <CustomButton variant="default">
                  Save Changes
                </CustomButton>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-6">
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium text-sm">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive email updates about your communities</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4A574]" />
                </label>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium text-sm">New Member Alerts</p>
                  <p className="text-xs text-muted-foreground">Get notified when someone joins your community</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4A574]" />
                </label>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium text-sm">Feed Activity</p>
                  <p className="text-xs text-muted-foreground">Notifications for likes, comments, and shares</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4A574]" />
                </label>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-sm">Marketing & Updates</p>
                  <p className="text-xs text-muted-foreground">Product updates and feature announcements</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4A574]" />
                </label>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-medium mb-4">Change Password</h3>
            <p className="text-sm text-muted-foreground mb-4">
              To change your password, we'll send a password reset link to your email address.
            </p>
            <CustomButton
              variant="default"
              onClick={() => {
                if (user?.email) {
                  import('@/firebase/auth').then(({ resetPassword }) => {
                    resetPassword(user.email!).then(() => {
                      alert('Password reset email sent! Check your inbox.');
                    }).catch(() => {
                      alert('Failed to send reset email. Please try again.');
                    });
                  });
                }
              }}
            >
              Send Password Reset Email
            </CustomButton>
          </div>
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-medium mb-4">Account Security</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">Two-Factor Authentication</span>
                <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">Coming Soon</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">Login History</span>
                <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">Coming Soon</span>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-medium mb-4">Theme</h3>
            <div className="grid grid-cols-3 gap-4">
              <button className="p-4 rounded-lg border-2 border-primary bg-white text-center">
                <div className="w-full h-8 bg-white border rounded mb-2" />
                <span className="text-sm font-medium">Light</span>
              </button>
              <button className="p-4 rounded-lg border-2 border-muted bg-gray-900 text-center text-white">
                <div className="w-full h-8 bg-gray-800 rounded mb-2" />
                <span className="text-sm font-medium">Dark</span>
              </button>
              <button className="p-4 rounded-lg border-2 border-muted bg-gradient-to-b from-white to-gray-900 text-center">
                <div className="w-full h-8 bg-gradient-to-r from-white to-gray-800 rounded mb-2" />
                <span className="text-sm font-medium">System</span>
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Theme switching will be available in a future update. Currently using Light mode.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
