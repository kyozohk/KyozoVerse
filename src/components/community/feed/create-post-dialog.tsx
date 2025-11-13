
'use client';

import { useState, useEffect } from 'react';
import { CustomFormDialog, Input, Textarea, Button, Dropzone } from '@/components/ui';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { uploadFile } from '@/lib/upload-helper';
import { PostType } from './create-post-buttons';
import { CreatePostDialogSkeleton } from './create-post-dialog-skeleton';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
        setTitle('');
        setDescription('');
        setFile(null);
    }
  }, [isOpen]);


  const handleSubmit = async () => {
    if (!user || !postType || !communityId) return;

    setIsSubmitting(true);

    let mediaUrl = '';
    if (file) {
      try {
        console.log('Uploading file using server-side API');
        mediaUrl = await uploadFile(file, communityId);
        console.log('Upload successful, URL:', mediaUrl);
      } catch (error) {
        console.error('Upload failed:', error);
        alert('Failed to upload file. Please try again.');
        setIsSubmitting(false);
        return;
      }
    }

    let finalPostType = postType;
    if (postType === 'text' && file) {
      finalPostType = 'image';
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
        type: finalPostType,
        createdAt: serverTimestamp(),
        likes: 0,
        comments: 0,
        visibility: 'public'
    };

    await addDoc(collection(db, 'blogs'), postData);

    setIsSubmitting(false);
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

  const getDialogDescription = () => {
      switch(postType) {
          case 'text': return 'Share your thoughts with the community. You can optionally add an image.';
          case 'image': return 'Upload an image to share with the community.';
          case 'audio': return 'Upload an audio file to start a conversation.';
          case 'video': return 'Upload a video to engage your audience.';
          default: return 'Share something new with your community.'
      }
  }

  const getFileInputAccept = () => {
    switch (postType) {
        case 'text': // Allow image for text posts
        case 'image': 
            return { 'image/*': ['.png', '.jpg', '.jpeg', '.gif']};
        case 'audio': return { 'audio/*': ['.mp3', '.wav', '.m4a']};
        case 'video': return { 'video/*': ['.mp4', '.mov', '.webm']};
        default: return {};
    }
  }

  return (
    <CustomFormDialog
      open={isOpen}
      onClose={() => setIsOpen(false)}
      title={getDialogTitle()}
      description={getDialogDescription()}
      showVideo={false}
    >
        {isSubmitting ? (
          <CreatePostDialogSkeleton />
        ) : (
          <div className="flex flex-col h-full">
              <div className="flex-grow space-y-4">
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
                   {(postType === 'text' || postType === 'image' || postType === 'audio' || postType === 'video') && (
                      <Dropzone
                          onFileChange={setFile}
                          file={file}
                          accept={getFileInputAccept()}
                          fileType={postType === 'text' ? 'image' : postType || 'image'}
                      />
                  )}
              </div>
              <div className="mt-auto pt-6 flex justify-end gap-4">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                      Post
                  </Button>
              </div>
          </div>
        )}
    </CustomFormDialog>
  );
};
