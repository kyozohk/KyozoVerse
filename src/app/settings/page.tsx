
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { storage } from '@/firebase/storage';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UploadCloud, X } from 'lucide-react';
import Image from 'next/image';
import { type User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const profileFormSchema = z.object({
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters." }).max(50),
  bio: z.string().max(160).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

function ImageUploader({
  label,
  currentImageUrl,
  onFileChange,
  isUploading,
}: {
  label: string;
  currentImageUrl: string | null | undefined;
  onFileChange: (file: File) => void;
  isUploading: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      onFileChange(file);
    }
  };

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <div className="flex items-center gap-4">
        {preview ? (
          <Image src={preview} alt="Preview" width={96} height={96} className="rounded-md object-cover h-24 w-24" />
        ) : currentImageUrl ? (
          <Image src={currentImageUrl} alt={label} width={96} height={96} className="rounded-md object-cover h-24 w-24" />
        ) : (
          <div className="h-24 w-24 bg-muted rounded-md flex items-center justify-center">
            <UploadCloud className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1">
          <FormControl>
             <Input type="file" accept="image/*" onChange={handleFileChange} disabled={isUploading} />
          </FormControl>
          <FormDescription>
            Upload a new image to replace the current one.
          </FormDescription>
        </div>
      </div>
    </FormItem>
  );
}


export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userData, setUserData] = useState<User | null>(null);
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
          const fetchedData = userSnap.data() as User;
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
        avatarUrl = await uploadImage(avatarFile, `avatars/${user.uid}`);
      }

      let coverUrl = userData.coverUrl;
      if (coverFile) {
        coverUrl = await uploadImage(coverFile, `covers/${user.uid}`);
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
          <div className="space-y-6">
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-6 w-2/3" />
              <Card>
                  <CardHeader>
                      <Skeleton className="h-8 w-1/4" />
                      <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent className="space-y-8">
                       <Skeleton className="h-10 w-full" />
                       <Skeleton className="h-24 w-full" />
                       <Skeleton className="h-24 w-full" />
                       <Skeleton className="h-24 w-full" />
                       <Skeleton className="h-10 w-24 self-end" />
                  </CardContent>
              </Card>
          </div>
      )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and profile settings.</p>
      </div>

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
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your display name" {...field} />
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
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell us a little bit about yourself" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <ImageUploader 
                label="Avatar Image"
                currentImageUrl={userData?.avatarUrl}
                onFileChange={setAvatarFile}
                isUploading={isUploading}
              />
              
              <ImageUploader 
                label="Cover Image"
                currentImageUrl={userData?.coverUrl}
                onFileChange={setCoverFile}
                isUploading={isUploading}
              />

              <Button type="submit" disabled={isUploading}>
                {isUploading ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
