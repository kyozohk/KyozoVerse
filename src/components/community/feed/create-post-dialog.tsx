

'use client';

import { useState, useEffect } from 'react';
import { CustomFormDialog, Input, Textarea, Button, Dropzone, Checkbox } from '@/components/ui';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { uploadFile } from '@/lib/upload-helper';
import { PostType } from './create-post-buttons';
import { CreatePostDialogSkeleton } from './create-post-dialog-skeleton';
import { type Post } from '@/lib/types';
import { getCommunityMembers } from '@/lib/community-utils';
import { renderPostToHtml } from '@/lib/email-utils';

interface CreatePostDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  postType: PostType | null;
  communityId: string;
  communityHandle: string;
  editPost?: (Post & { id: string }) | null;
}

export const CreatePostDialog: React.FC<CreatePostDialogProps> = ({ 
    isOpen, 
    setIsOpen, 
    postType, 
    communityId,
    communityHandle,
    editPost
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  // Populate form when editing
  useEffect(() => {
    if (editPost) {
      setTitle(editPost.title || '');
      setDescription(editPost.content.text || '');
      setIsPublic(editPost.visibility === 'public');
    }
  }, [editPost]);

  useEffect(() => {
    if (!isOpen) {
        setTitle('');
        setDescription('');
        setFile(null);
        setIsPublic(true); // Reset to default (public) when dialog closes
    }
  }, [isOpen]);

  const sendNewPostEmails = async (post: Post & { id: string }) => {
    try {
      console.log('📬 Fetching members for email notification...');
      const members = await getCommunityMembers(communityId);
      const recipients = members
        .map(m => m.userDetails?.email)
        .filter((email): email is string => !!email);

      if (recipients.length === 0) {
        console.log('📬 No members with emails found to notify.');
        return;
      }

      console.log(`📬 Sending new post notification to ${recipients.length} members.`);

      const postHtml = renderPostToHtml(post, communityHandle);

      await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: recipients,
          subject: `New Post in ${post.communityHandle}: ${post.title}`,
          html: postHtml,
        }),
      });

      console.log('✅ Emails sent successfully.');
    } catch (error) {
      console.error('❌ Error sending new post emails:', error);
      // We don't want to block the UI for this, so we just log the error.
    }
  };


  const handleSubmit = async () => {
    if (!user || !postType || !communityId) return;

    if (!title.trim()) {
      alert('Please enter a title for your post');
      return;
    }

    if (!editPost && (postType === 'audio' || postType === 'video') && !file) {
      alert(`Please upload a ${postType} file`);
      return;
    }

    setIsSubmitting(true);

    let mediaUrl = '';
    let fileCategory = '';
    let fileType = '';
    
    if (file) {
      try {
        console.log(`Uploading ${postType} file using server-side API:`, file.name, file.type);
        const uploadResult = await uploadFile(file, communityId);
        
        if (typeof uploadResult === 'string') {
          mediaUrl = uploadResult;
        } else {
          mediaUrl = uploadResult.url || '';
          fileCategory = uploadResult.fileCategory || '';
          fileType = uploadResult.fileType || '';
        }
      } catch (error) {
        console.error('Upload failed:', error);
        alert(`Failed to upload ${postType} file. Please try again.`);
        setIsSubmitting(false);
        return;
      }
    }

    // Keep the original postType - don't change text to image just because it has an image attachment
    let finalPostType = postType;

    try {
      if (editPost) {
        const postRef = doc(db, 'blogs', editPost.id);
        const updateData: any = {
          title,
          content: {
            text: description,
            mediaUrls: file ? [mediaUrl] : editPost.content.mediaUrls || [],
          },
          visibility: isPublic ? 'public' : 'private',
          updatedAt: serverTimestamp()
        };
        
        await updateDoc(postRef, updateData);
        console.log('Post updated successfully');
      } else {
        const postData = {
          title,
          content: {
            text: description,
            mediaUrls: file ? [mediaUrl] : [],
            fileType: file ? file.type : ''
          },
          authorId: user.uid,
          communityId: communityId,
          communityHandle: communityHandle,
          type: finalPostType,
          createdAt: serverTimestamp(),
          likes: 0,
          comments: 0,
          visibility: isPublic ? 'public' : 'private'
        };
        
        const docRef = await addDoc(collection(db, 'blogs'), postData);
        console.log('Post created successfully:', finalPostType);
        
        if (isPublic) {
            const newPostForEmail: Post & { id: string } = {
                ...postData,
                id: docRef.id,
                author: {
                    userId: user.uid,
                    displayName: user.displayName || 'Community Owner'
                }
            };
            sendNewPostEmails(newPostForEmail);
        }
      }
      
      setIsSubmitting(false);
      setIsOpen(false);
    } catch (error) {
      console.error(`Failed to ${editPost ? 'update' : 'create'} post:`, error);
      alert(`Failed to ${editPost ? 'update' : 'create'} post. Please try again.`);
      setIsSubmitting(false);
    }
  };

  const getDialogTitle = () => {
    const action = editPost ? 'Edit' : 'Create';
    switch (postType) {
        case 'text': return `${action} a Text Post`;
        case 'image': return `${action} an Image Post`;
        case 'audio': return `${action} an Audio Post`;
        case 'video': return `${action} a Video Post`;
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
        case 'text':
        case 'image': 
            return { 'image/*': [] };
        case 'audio': return { 'audio/*': [] };
        case 'video': return { 'video/*': [] };
        default: return undefined;
    }
  }

  return (
    <CustomFormDialog
      open={isOpen}
      onClose={() => setIsOpen(false)}
      title={getDialogTitle()}
      description={getDialogDescription()}
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
                      label="Description"
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
                  
                  <div className="mt-4">
                    <Checkbox
                      label="Make this post public"
                      checked={isPublic}
                      onCheckedChange={setIsPublic}
                    />
                    <p className="text-xs text-muted-foreground mt-1 ml-6">
                      {isPublic ? 
                        'Public posts are visible to everyone in the community' : 
                        'Private posts are only visible to you and community admins'}
                    </p>
                  </div>
              </div>
              <div className="mt-8 flex justify-end gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsOpen(false)} 
                    className="py-3 text-base font-medium"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                    className="py-3 text-base font-medium bg-primary text-white hover:bg-primary/90"
                  >
                    Post
                  </Button>
              </div>
          </div>
        )}
    </CustomFormDialog>
  );
};
