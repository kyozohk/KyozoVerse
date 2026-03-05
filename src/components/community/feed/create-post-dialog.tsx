

'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { CustomFormDialog, Input, Textarea, Button, Dropzone, Checkbox } from '@/components/ui';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { uploadFile, deleteFileByUrl } from '@/lib/upload-helper';
import { PostType } from './create-post-buttons';
import { CreatePostDialogSkeleton } from './create-post-dialog-skeleton';
import { type Post } from '@/lib/types';
import { getCommunityMembers } from '@/lib/community-utils';
import { renderPostToHtml } from '@/lib/email-utils';
import { ReadCard } from '@/components/content-cards/read-card';
import { ListenCard } from '@/components/content-cards/listen-card';
import { WatchCard } from '@/components/content-cards/watch-card';
import { ImageCard } from '@/components/content-cards/image-card';

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
  const [isPublic, setIsPublic] = useState(true);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);

  // File states
  const [file, setFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  
  // URL states for existing media
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract thumbnail from video
  const extractVideoThumbnail = async (videoFile: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        resolve(null);
        return;
      }

      video.preload = 'metadata';
      video.src = URL.createObjectURL(videoFile);

      video.onloadedmetadata = () => {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Seek to 1 second (or 10% of video duration)
        const seekTime = Math.min(1, video.duration * 0.1);
        video.currentTime = seekTime;
      };

      video.onseeked = () => {
        // Draw the video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            const thumbnailUrl = URL.createObjectURL(blob);
            resolve(thumbnailUrl);
          } else {
            resolve(null);
          }
          URL.revokeObjectURL(video.src);
        }, 'image/jpeg', 0.8);
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve(null);
      };
    });
  };

  // Auto-generate thumbnail for video files
  const handleVideoFileChange = async (file: File | null) => {
    if (!file) {
      setFile(null);
      return;
    }
    
    setFile(file);
    
    if (file && postType === 'video') {
      setIsGeneratingThumbnail(true);
      try {
        const generatedThumbnailUrl = await extractVideoThumbnail(file);
        if (generatedThumbnailUrl && !thumbnailFile && !thumbnailUrl) {
          // Convert blob URL to file
          const response = await fetch(generatedThumbnailUrl);
          const blob = await response.blob();
          const thumbnailFile = new File([blob], `thumbnail-${file.name}.jpg`, {
            type: 'image/jpeg'
          });
          setThumbnailFile(thumbnailFile);
          URL.revokeObjectURL(generatedThumbnailUrl);
        }
      } catch (error) {
        console.error('Failed to generate thumbnail:', error);
      } finally {
        setIsGeneratingThumbnail(false);
      }
    }
  };

  // Populate form when editing
  useEffect(() => {
    if (isOpen && editPost) {
      setTitle(editPost.title || '');
      setDescription(editPost.content.text || '');
      setIsPublic(editPost.visibility === 'public');
      setMediaUrl(editPost.content.mediaUrls?.[0] || null);
      setThumbnailUrl(editPost.content.thumbnailUrl || null);
    } else {
        resetState();
    }
  }, [editPost, isOpen]);

  const resetState = () => {
    setTitle('');
    setDescription('');
    setFile(null);
    setThumbnailFile(null);
    setMediaUrl(null);
    setThumbnailUrl(null);
    setIsPublic(true);
    setIsSubmitting(false);
  }

  const handleClose = () => {
    resetState();
    setIsOpen(false);
  }

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
          from: 'Kyozo <dev@kyozo.com>', // Verified Resend domain
        }),
      });

      console.log('✅ Emails sent successfully.');
    } catch (error) {
      console.error('❌ Error sending new post emails:', error);
    }
  };

  const handleFileUpload = async (fileToUpload: File, type: 'media' | 'thumbnail'): Promise<string> => {
    console.log(`📤 Uploading ${type} file:`, {
      fileName: fileToUpload.name,
      fileSize: fileToUpload.size,
      fileType: fileToUpload.type,
    });

    const timestamp = Date.now();
    const fileName = `${type}-${timestamp}-${fileToUpload.name}`;
    const filePath = `communities/${communityHandle}/${type}/${fileName}`;

    try {
      const url = await uploadFile(fileToUpload, filePath);
      console.log(`✅ ${type} uploaded successfully:`, url);
      return typeof url === 'string' ? url : url.url;
    } catch (error) {
      console.error(`❌ Failed to upload ${type}:`, error);
      throw new Error(`Failed to upload ${type} file: ${(error as Error)?.message || 'Unknown error'}`);
    }
  };

  const handleSubmit = async () => {
    if (!user || !postType || !communityId) return;

    if (!title.trim()) {
      alert('Please enter a title for your post');
      return;
    }

    if (!editPost && (postType === 'audio' || postType === 'video' || postType === 'image') && !file) {
      alert(`Please upload a ${postType} file`);
      return;
    }

    setIsSubmitting(true);

    try {
        let finalMediaUrl = mediaUrl;
        let finalThumbnailUrl = thumbnailUrl;

        // Handle media file update
        if (file) {
            // If there's a new file, upload it
            finalMediaUrl = await handleFileUpload(file, 'media');
            // If there was an old media URL, delete it from storage
            if (mediaUrl && mediaUrl !== finalMediaUrl) {
                await deleteFileByUrl(mediaUrl);
            }
        } else if (!mediaUrl && editPost?.content.mediaUrls?.[0]) {
            // If mediaUrl is cleared and there was an old one, delete it
            await deleteFileByUrl(editPost.content.mediaUrls[0]);
        }

        // Handle thumbnail file update (only for videos)
        if (postType === 'video') {
            console.log('🎬 Processing video thumbnail:', {
              hasThumbnailFile: !!thumbnailFile,
              currentThumbnailUrl: thumbnailUrl,
              editPostThumbnailUrl: editPost?.content.thumbnailUrl
            });
            if (thumbnailFile) {
                console.log('📸 Uploading new thumbnail...');
                finalThumbnailUrl = await handleFileUpload(thumbnailFile, 'thumbnail');
                console.log('✅ Thumbnail uploaded:', finalThumbnailUrl);
                if (thumbnailUrl && thumbnailUrl !== finalThumbnailUrl) {
                    console.log('🗑️ Deleting old thumbnail:', thumbnailUrl);
                    await deleteFileByUrl(thumbnailUrl);
                }
            } else if (!thumbnailUrl && editPost?.content.thumbnailUrl) {
                console.log('🗑️ Deleting removed thumbnail:', editPost.content.thumbnailUrl);
                await deleteFileByUrl(editPost.content.thumbnailUrl);
            }
        }

        const contentPayload: any = {
          text: description,
          mediaUrls: finalMediaUrl ? [finalMediaUrl] : [],
          fileType: file?.type || editPost?.content.fileType || '',
        };
        
        // Only add thumbnailUrl for video posts
        if (postType === 'video' && finalThumbnailUrl) {
          contentPayload.thumbnailUrl = finalThumbnailUrl;
        }

        if (editPost) {
            await updateDoc(doc(db, 'blogs', editPost.id), {
                title,
                content: contentPayload,
                visibility: isPublic ? 'public' : 'private',
                updatedAt: serverTimestamp()
            });
        } else {
            const newPostData = {
                title,
                content: contentPayload,
                authorId: user.uid,
                communityId: communityId,
                communityHandle: communityHandle,
                type: postType,
                createdAt: serverTimestamp(),
                likes: 0,
                comments: 0,
                visibility: isPublic ? 'public' : 'private'
            };
            const docRef = await addDoc(collection(db, 'blogs'), newPostData);
            if (isPublic) {
              sendNewPostEmails({ ...newPostData, id: docRef.id, author: { userId: user.uid, displayName: user.displayName || '' } });
            }
        }
        
        handleClose();
    } catch (error) {
        console.error(`Failed to ${editPost ? 'update' : 'create'} post:`, error);
        alert(`Failed to ${editPost ? 'update' : 'create'} post. Please try again.`);
    } finally {
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
            return { 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'] };
        case 'audio': return { 'audio/*': ['.mp3', '.wav', '.ogg', '.m4a'] };
        case 'video': return { 'video/*': ['.mp4', '.mov', '.avi', '.webm'] };
        default: return { '*/*': [] };
    }
  }

  // Create preview post object
  const previewPost = useMemo(() => {
    const basePost = {
      id: 'preview',
      postId: 'preview',
      title: title || 'Untitled',
      content: {
        text: description,
        mediaUrls: mediaUrl ? [mediaUrl] : file ? [URL.createObjectURL(file)] : [],
        thumbnailUrl: thumbnailUrl || (thumbnailFile ? URL.createObjectURL(thumbnailFile) : undefined),
      },
      type: postType as 'text' | 'image' | 'audio' | 'video',
      authorId: user?.uid || '',
      communityId,
      communityHandle,
      author: {
        userId: user?.uid || '',
        displayName: user?.displayName || 'You',
      },
      createdAt: new Date(),
      likes: 0,
      comments: 0,
      visibility: isPublic ? 'public' : 'private' as const,
      _isPublicView: true,
    };
    return basePost;
  }, [title, description, mediaUrl, file, thumbnailUrl, thumbnailFile, postType, user, communityId, communityHandle, isPublic]);

  // Render preview based on post type
  const renderPreview = () => {
    if (!title && !description && !mediaUrl && !file) {
      return (
        <div className="relative h-full bg-no-repeat bg-cover bg-center" style={{ backgroundImage: 'url(/bg/public-feed-bg.jpg)' }}>
          <div className="absolute inset-0 bg-[#D9D9D9]/70"></div>
          <div className="relative z-10 flex items-center justify-center h-full">
            <p className="text-gray-600 text-lg font-medium">Preview will appear here</p>
          </div>
        </div>
      );
    }

    const commonProps = {
      post: previewPost as any,
      key: 'preview',
    };

    switch (postType) {
      case 'text':
        return (
          <div className="relative h-full overflow-auto bg-no-repeat bg-cover bg-center" style={{ backgroundImage: 'url(/bg/public-feed-bg.jpg)' }}>
            <div className="absolute inset-0 bg-[#D9D9D9]/70"></div>
            <div className="relative z-10 p-8">
              <ReadCard
                {...commonProps}
                category="Preview"
                readTime="1 min"
                date="Just now"
                title={title || 'Untitled'}
                summary={description}
                isPrivate={!isPublic}
              />
            </div>
          </div>
        );
      case 'audio':
        return (
          <div className="relative h-full overflow-auto bg-no-repeat bg-cover bg-center" style={{ backgroundImage: 'url(/bg/public-feed-bg.jpg)' }}>
            <div className="absolute inset-0 bg-[#D9D9D9]/70"></div>
            <div className="relative z-10 p-8">
              <ListenCard
                {...commonProps}
                category="Preview"
                episode="New"
                duration="0:00"
                title={title || 'Untitled'}
                summary={description}
                isPrivate={!isPublic}
              />
            </div>
          </div>
        );
      case 'video':
        return (
          <div className="relative h-full overflow-auto bg-no-repeat bg-cover bg-center" style={{ backgroundImage: 'url(/bg/public-feed-bg.jpg)' }}>
            <div className="absolute inset-0 bg-[#D9D9D9]/70"></div>
            <div className="relative z-10 p-8">
              <WatchCard
                {...commonProps}
                category="Preview"
                title={title || 'Untitled'}
                imageUrl={thumbnailUrl || (thumbnailFile ? URL.createObjectURL(thumbnailFile) : '') || '/placeholder-video.jpg'}
                imageHint={description || ''}
                isPrivate={!isPublic}
              />
            </div>
          </div>
        );
      case 'image':
        return (
          <div className="relative h-full overflow-auto bg-no-repeat bg-cover bg-center" style={{ backgroundImage: 'url(/bg/public-feed-bg.jpg)' }}>
            <div className="absolute inset-0 bg-[#D9D9D9]/70"></div>
            <div className="relative z-10 p-8">
              <ImageCard
                {...commonProps}
                category="Preview"
                readTime="1 min"
                date="Just now"
                title={title || 'Untitled'}
                summary={description}
                imageUrl={mediaUrl || (file ? URL.createObjectURL(file) : '') || '/placeholder-image.jpg'}
                isPrivate={!isPublic}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <CustomFormDialog
      open={isOpen}
      onClose={handleClose}
      title={getDialogTitle()}
      description={getDialogDescription()}
      rightComponent={renderPreview()}
    >
        {isSubmitting ? (
          <div className="flex-grow flex items-center justify-center">
            <CreatePostDialogSkeleton />
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-grow space-y-4 overflow-y-auto pr-2 pb-4">
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
                  onFileChange={postType === 'video' ? handleVideoFileChange : setFile}
                  onRemoveExisting={() => setMediaUrl(null)}
                  file={file}
                  accept={getFileInputAccept()}
                  fileType={postType === 'text' ? 'image' : postType || 'image'}
                  existingImageUrl={mediaUrl}
                />
              )}
              {postType === 'video' && (
                <div className="space-y-2">
                  {isGeneratingThumbnail && (
                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      <span className="text-sm text-blue-700">Generating thumbnail from video...</span>
                    </div>
                  )}
                  <Dropzone
                    label="Custom Thumbnail (Optional)"
                    onFileChange={setThumbnailFile}
                    onRemoveExisting={() => setThumbnailUrl(null)}
                    file={thumbnailFile}
                    accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'] }}
                    fileType="image"
                    existingImageUrl={thumbnailUrl}
                  />
                </div>
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
            
            <div className="sticky bottom-0 flex flex-shrink-0 justify-end gap-4 pt-4 pb-2" >
              <Button 
                variant="outline" 
                onClick={handleClose}
                className="py-3 text-base font-medium"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="py-3 text-base font-medium bg-primary text-white hover:bg-primary/90"
              >
                {isSubmitting ? (editPost ? 'Saving...' : 'Posting...') : (editPost ? 'Save Changes' : 'Post')}
              </Button>
            </div>
          </div>
        )}
    </CustomFormDialog>
  );
};
