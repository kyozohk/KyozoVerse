
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { storage } from '@/firebase/storage';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Settings as SettingsIcon, Palette, User, Shield } from 'lucide-react';
import Image from 'next/image';
import { type User as UserType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dropzone } from '@/components/ui';

const profileFormSchema = z.object({
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters." }).max(50),
  bio: z.string().max(160).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userData, setUserData] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: '',
      bio: '',
    },
  });

  useEffect(() => {
    async function fetchUserData() {
      if (!user) return;
      setLoading(true);
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const fetchedData = userSnap.data() as UserType;
          setUserData(fetchedData);
          form.reset({
            displayName: fetchedData.displayName || '',
            bio: fetchedData.bio || '',
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({
          title: "Error",
          description: "Could not fetch your profile data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchUserData();
  }, [user, form, toast]);

  const uploadImage = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    const uploadResult = await uploadBytes(storageRef, file);
    return getDownloadURL(uploadResult.ref);
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user || !userData) return;
    setIsUploading(true);

    try {
      let avatarUrl = userData.avatarUrl;
      if (avatarFile) {
        avatarUrl = await uploadImage(avatarFile, `user-media/${user.uid}/avatar/${avatarFile.name}`);
      }

      let coverUrl = userData.coverUrl;
      if (coverFile) {
        coverUrl = await uploadImage(coverFile, `user-media/${user.uid}/cover/${coverFile.name}`);
      }
      
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        ...data,
        avatarUrl,
        coverUrl,
      }, { merge: true });
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });

      // Refetch data to show updated images
       const userSnap = await getDoc(userRef);
       if (userSnap.exists()) {
         setUserData(userSnap.data() as UserType);
       }

    } catch (error) {
      console.error("Error updating profile: ", error);
      toast({
        title: "Error",
        description: "Could not update your profile.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  if (loading) {
      return (
          <div className="container mx-auto px-4 py-6 space-y-6">
              <Skeleton className="h-40 w-full" />
              <Card>
                  <CardHeader>
                      <Skeleton className="h-8 w-1/4" />
                      <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent className="space-y-8">
                       <Skeleton className="h-10 w-full" />
                       <Skeleton className="h-24 w-full" />
                       <Skeleton className="h-24 w-full" />
                       <Skeleton className="h-10 w-24 self-end" />
                  </CardContent>
              </Card>
          </div>
      )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-gradient-to-r from-[#06C4B5] to-[#4DDFD3] text-white p-6 md:p-8 rounded-xl shadow-lg mb-8">
        <div className="flex items-center mb-2">
          <SettingsIcon className="h-6 w-6 mr-2" />
          <h2 className="text-2xl md:text-3xl font-bold">Settings</h2>
        </div>
        
        <div className="flex items-center text-white/90 mb-4 bg-white/10 px-3 py-1 rounded-full w-fit">
          <User className="h-5 w-5 mr-2" />
          <span>Manage your account and profile settings</span>
        </div>
        
        <p className="text-white/90 max-w-md backdrop-blur-sm bg-black/5 p-3 rounded-lg">
          Update your public profile, notification preferences, and security settings.
        </p>
      </div>

      <div className="relative h-48 w-full rounded-lg overflow-hidden mb-[-48px]">
        {userData?.coverUrl && <Image src={userData.coverUrl} alt="Cover image" fill className="object-cover" />}
      </div>
      
      <div className="relative flex items-end px-8">
        <Avatar className="h-24 w-24 border-4 border-background">
          <AvatarImage src={userData?.avatarUrl} />
          <AvatarFallback>{userData?.displayName?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
      </div>

      <Tabs defaultValue="profile" className="w-full mt-8">
        <TabsList className="mb-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <User className="h-4 w-4" />
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
          <Card>
            <CardHeader>
              <CardTitle>Public Profile</CardTitle>
              <CardDescription>This information will be displayed publicly on your profile.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input label="Display Name" placeholder="Your display name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea label="Bio" placeholder="Tell us a little bit about yourself" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Dropzone 
                    label="Avatar Image"
                    onFileChange={setAvatarFile}
                    file={avatarFile}
                    fileType="image"
                    accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.gif'] }}
                    existingImageUrl={userData?.avatarUrl}
                    className="h-32"
                  />
                  
                  <Dropzone 
                    label="Cover Image"
                    onFileChange={setCoverFile}
                    file={coverFile}
                    fileType="image"
                    accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.gif'] }}
                    existingImageUrl={userData?.coverUrl}
                    className="h-32"
                  />

                  <Button type="submit" disabled={isUploading}>
                    {isUploading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>Manage how you receive notifications.</CardDescription>
                </CardHeader>
                <CardContent className="text-center py-12 text-muted-foreground">
                    <p>Notification settings are coming soon.</p>
                </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="security" className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Security</CardTitle>
                    <CardDescription>Manage your account security.</CardDescription>
                </CardHeader>
                <CardContent className="text-center py-12 text-muted-foreground">
                    <p>Security settings are coming soon.</p>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>Customize the look and feel of the app.</CardDescription>
                </CardHeader>
                <CardContent className="text-center py-12 text-muted-foreground">
                    <p>Appearance settings are coming soon.</p>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
