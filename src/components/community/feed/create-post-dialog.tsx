

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
  const [fillRow, setFillRow] = useState(false);
  const [isPoetry, setIsPoetry] = useState(false);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);

  // File states
  const [file, setFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  
  // URL states for existing media
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  // Recording states (audio + video)
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingMode, setRecordingMode] = useState<'audio' | 'video' | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const liveVideoRef = useRef<HTMLVideoElement>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadingFile, setUploadingFile] = useState<'media' | 'thumbnail' | null>(null);

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

  // Recording functions
  const startRecording = async (mode: 'audio' | 'video') => {
    try {
      const constraints = mode === 'video'
        ? { audio: true, video: { facingMode: 'user' } }
        : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaRecorderRef.current = null;
      chunksRef.current = [];

      if (mode === 'video') {
        setCameraStream(stream);
        setTimeout(() => {
          if (liveVideoRef.current) {
            liveVideoRef.current.srcObject = stream;
            liveVideoRef.current.play();
          }
        }, 50);
      }

      const mimeType = mode === 'video' ? 'video/webm' : 'audio/webm';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        const recorded = new File([blob], `recording-${Date.now()}.webm`, { type: mimeType });
        if (mode === 'video') {
          handleVideoFileChange(recorded);
        } else {
          setFile(recorded);
        }
        stream.getTracks().forEach(t => t.stop());
        setCameraStream(null);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingMode(mode);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to access camera/microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Populate form when editing
  useEffect(() => {
    if (isOpen && editPost) {
      setTitle(editPost.title || '');
      setDescription(editPost.content.text || '');
      setIsPublic(editPost.visibility === 'public');
      setFillRow(editPost.fillRow || false);
      setIsPoetry(editPost.isPoetry || false);
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
    setFillRow(false);
    setIsPoetry(false);
    setIsSubmitting(false);
    setIsRecording(false);
    setRecordedBlob(null);
    setRecordingMode(null);
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }
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

      if (!user) {
        throw new Error('User not authenticated');
      }

      const idToken = await user.getIdToken();

      await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
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

    // Check if user is authenticated
    if (!user) {
      throw new Error('User must be authenticated to upload files');
    }

    try {
      setUploadingFile(type);
      setUploadProgress(0);
      
      const url = await uploadFile(fileToUpload, communityId, (progress) => {
        setUploadProgress(progress);
      });
      
      setUploadingFile(null);
      setUploadProgress(0);
      
      console.log(`✅ ${type} uploaded successfully:`, url);
      return typeof url === 'string' ? url : url.url;
    } catch (error) {
      setUploadingFile(null);
      setUploadProgress(0);
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
          console.log('✅ Adding thumbnail to content payload:', finalThumbnailUrl);
        } else if (postType === 'video') {
          console.log('⚠️ No thumbnail URL available for video post');
        }

        console.log('📦 Final content payload:', contentPayload);

        if (editPost) {
            await updateDoc(doc(db, 'blogs', editPost.id), {
                title,
                content: contentPayload,
                visibility: isPublic ? 'public' : 'private',
                fillRow: fillRow,
                isPoetry: postType === 'text' ? isPoetry : false,
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
                visibility: (isPublic ? 'public' : 'private') as 'public' | 'private',
                fillRow: fillRow,
                isPoetry: postType === 'text' ? isPoetry : false
            };
            const docRef = await addDoc(collection(db, 'blogs'), newPostData);
            if (isPublic) {
              sendNewPostEmails({ ...newPostData, id: docRef.id, postId: docRef.id, author: { userId: user.uid, displayName: user.displayName || '' } });
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

  const getFileInputAccept = (): Record<string, string[]> => {
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
      isPoetry: postType === 'text' ? isPoetry : false,
      _isPublicView: true,
    };
    return basePost;
  }, [title, description, mediaUrl, file, thumbnailUrl, thumbnailFile, postType, user, communityId, communityHandle, isPublic, isPoetry]);

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

  const dialogFooter = (
    <div className="flex justify-between items-center gap-4">
      <div className="flex items-center gap-6">
        <Checkbox
          label="Make this post public"
          checked={isPublic}
          onCheckedChange={setIsPublic}
        />
        <Checkbox
          label="Fill the row"
          checked={fillRow}
          onCheckedChange={setFillRow}
        />
      </div>
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={handleClose}
          className="px-6 py-2"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !title.trim()}
          className="px-6 py-2 text-white disabled:opacity-40"
          style={{ backgroundColor: '#6B5D52' }}
        >
          {isSubmitting ? (editPost ? 'Saving...' : 'Posting...') : (editPost ? 'Save Changes' : 'Post')}
        </Button>
      </div>
    </div>
  );

  return (
    <CustomFormDialog
      open={isOpen}
      onOpenChange={(open) => { if (!open) handleClose(); }}
      title={getDialogTitle()}
      description={getDialogDescription()}
      size="xl"
      rightComponent={renderPreview()}
      footer={dialogFooter}
    >
        {uploadingFile && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm font-medium text-blue-900">
                  Uploading {uploadingFile === 'media' ? 'file' : 'thumbnail'}...
                </span>
              </div>
              <span className="text-sm font-semibold text-blue-700">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
        {isSubmitting ? (
          <div className="flex items-center justify-center py-16">
            <CreatePostDialogSkeleton />
          </div>
        ) : (
          <div className="space-y-4">
            <Input 
              label="Title"
              placeholder="Title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
            />
            {postType === 'text' && (
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium" style={{ color: '#5B4A3A' }}>Content</label>
                <button
                  type="button"
                  onClick={() => setIsPoetry(!isPoetry)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isPoetry
                      ? 'bg-[#D4870E] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                  Poetry Mode
                </button>
              </div>
            )}
            {isPoetry && postType === 'text' && (
              <div className="p-3 rounded-lg border border-[#D4870E]/30 bg-[#D4870E]/5">
                <p className="text-xs" style={{ color: '#D4870E' }}>
                  <strong>Poetry Mode:</strong> Each paragraph becomes one page. Use a double line break (press Enter twice) to start a new page. Single line breaks within a paragraph are preserved.
                </p>
              </div>
            )}
            <Textarea 
              label={postType === 'text' && !isPoetry ? 'Description' : undefined}
              placeholder={isPoetry ? 'Paste or type your poem here...\n\nLine breaks and spacing\nwill be preserved exactly\nas you enter them.' : 'Description'} 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              rows={isPoetry ? 10 : 6}
              className={isPoetry ? 'font-mono' : ''}
            />
            {postType === 'audio' && (
              <div className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  {!isRecording ? (
                    <Button type="button" variant="default" onClick={() => startRecording('audio')} className="flex-1">
                      🎤 Record Audio
                    </Button>
                  ) : recordingMode === 'audio' ? (
                    <Button type="button" variant="destructive" onClick={stopRecording} className="flex-1">
                      ⏹ Stop Recording
                    </Button>
                  ) : null}
                  {(recordedBlob || file) && (
                    <Button type="button" variant="outline" onClick={() => { setRecordedBlob(null); setFile(null); setMediaUrl(null); }}>
                      Clear
                    </Button>
                  )}
                </div>
                {isRecording && recordingMode === 'audio' && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                    <div className="animate-pulse h-3 w-3 rounded-full bg-red-500"></div>
                    <span className="text-sm text-red-700">Recording...</span>
                  </div>
                )}
                {(recordedBlob || file || mediaUrl) && !isRecording && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <audio controls className="w-full">
                      <source src={recordedBlob ? URL.createObjectURL(recordedBlob) : file ? URL.createObjectURL(file) : mediaUrl || ''} />
                    </audio>
                  </div>
                )}
                <div className="text-center text-sm text-gray-400">— or upload a file —</div>
                <Dropzone
                  onFileChange={setFile}
                  onRemoveExisting={() => setMediaUrl(null)}
                  file={file}
                  accept={getFileInputAccept()}
                  fileType="audio"
                  existingImageUrl={mediaUrl}
                />
              </div>
            )}
            {postType === 'video' && (
              <div className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  {!isRecording ? (
                    <Button type="button" variant="default" onClick={() => startRecording('video')} className="flex-1">
                      📹 Record Video
                    </Button>
                  ) : recordingMode === 'video' ? (
                    <Button type="button" variant="destructive" onClick={stopRecording} className="flex-1">
                      ⏹ Stop Recording
                    </Button>
                  ) : null}
                  {(recordedBlob || file) && (
                    <Button type="button" variant="outline" onClick={() => { setRecordedBlob(null); setFile(null); setMediaUrl(null); }}>
                      Clear
                    </Button>
                  )}
                </div>
                {isRecording && recordingMode === 'video' && (
                  <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                    <video ref={liveVideoRef} muted playsInline className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 flex items-center gap-2 bg-black/60 rounded px-2 py-1">
                      <div className="animate-pulse h-2 w-2 rounded-full bg-red-500"></div>
                      <span className="text-xs text-white">Recording</span>
                    </div>
                  </div>
                )}
                {(recordedBlob || file || mediaUrl) && !isRecording && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <video controls className="w-full rounded">
                      <source src={recordedBlob ? URL.createObjectURL(recordedBlob) : file ? URL.createObjectURL(file) : mediaUrl || ''} />
                    </video>
                  </div>
                )}
                <div className="text-center text-sm text-gray-400">— or upload a file —</div>
                <Dropzone
                  onFileChange={handleVideoFileChange}
                  onRemoveExisting={() => setMediaUrl(null)}
                  file={file}
                  accept={getFileInputAccept()}
                  fileType="video"
                  existingImageUrl={mediaUrl}
                />
                {isGeneratingThumbnail && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-sm text-blue-700">Generating thumbnail...</span>
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
            {(postType === 'text' || postType === 'image') && (
              <Dropzone
                onFileChange={setFile}
                onRemoveExisting={() => setMediaUrl(null)}
                file={file}
                accept={getFileInputAccept()}
                fileType={postType === 'text' ? 'image' : 'image'}
                existingImageUrl={mediaUrl}
              />
            )}

          </div>
        )}
    </CustomFormDialog>
  );
};
