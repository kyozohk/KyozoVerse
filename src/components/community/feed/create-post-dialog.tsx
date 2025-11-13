
'use client';

import { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PostType } from './create-post-buttons';

interface CreatePostDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  postType: PostType | null;
  communityId: string;
  communityHandle: string;
}

export const CreatePostDialog: React.FC<CreatePostDialogProps> = ({ 
    isOpen, 
    setIsOpen, 
    postType, 
    communityId,
    communityHandle
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
        setTitle('');
        setDescription('');
        setFile(null);
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!user || !postType || !communityId) return;

    setIsUploading(true);

    let mediaUrl = '';
    if (file) {
      const storage = getStorage();
      const storageRef = ref(storage, `community-posts/${communityId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      mediaUrl = await getDownloadURL(storageRef);
    }

    const postData = {
        title,
        content: {
            text: description,
            mediaUrls: file ? [mediaUrl] : []
        },
        authorId: user.uid,
        communityId: communityId,
        communityHandle: communityHandle,
        type: file ? postType : (postType === 'image' ? 'image' : 'text'),
        createdAt: serverTimestamp(),
        likes: 0,
        comments: 0,
        visibility: 'public'
    };

    await addDoc(collection(db, 'blogs'), postData);

    setIsUploading(false);
    setIsOpen(false);
  };

  const getDialogTitle = () => {
    switch (postType) {
        case 'text': return 'Create a Text Post';
        case 'image': return 'Create an Image Post';
        case 'audio': return 'Create an Audio Post';
        case 'video': return 'Create a Video Post';
        default: return 'Create a Post';
    }
  }

  const getFileInputAccept = () => {
    switch (postType) {
        case 'image': return 'image/*';
        case 'audio': return 'audio/mp3,audio/mp4';
        case 'video': return 'video/mp4';
        default: return '*';
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="sm:max-w-[800px]">
        <AlertDialogHeader>
          <AlertDialogTitle>{getDialogTitle()}</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
                <Input 
                    label="Title"
                    placeholder="Title" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                />
                <Textarea 
                    placeholder="Description" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    rows={6}
                />
                {(postType === 'image' || postType === 'audio' || postType === 'video') && (
                    <Input 
                        label="Media file"
                        type="file" 
                        onChange={handleFileChange} 
                        accept={getFileInputAccept()}
                    />
                )}
            </div>
            <div className="flex items-center justify-center bg-muted rounded-lg">
                {file && postType === 'video' && (
                    <video src={URL.createObjectURL(file)} controls className="w-full h-auto" />
                )}
                {file && postType === 'image' && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-auto" />
                )}
                 {file && postType === 'audio' && (
                    <audio src={URL.createObjectURL(file)} controls className="w-full" />
                )}
            </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Post'}
            </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
